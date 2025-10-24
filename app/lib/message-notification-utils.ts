/**
 * Message Notification Utilities
 * Handles intelligent email notifications for chat messages
 * - Only sends if user is offline or hasn't read after 10 minutes
 * - Prevents duplicate emails for the same message
 * - Tracks notification status in Firestore
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Check if a message should trigger an email notification
 * Returns true if email should be sent
 */
export async function shouldSendMessageNotification(
  messageId: string,
  conversationId: string,
  sender: 'customer' | 'business'
): Promise<boolean> {
  try {
    // Check if email was already sent for this message
    const messageDoc = await getDoc(doc(db, 'chatMessages', messageId));
    
    if (!messageDoc.exists()) {
      console.log('Message not found:', messageId);
      return false;
    }

    const messageData = messageDoc.data();
    
    // If email already sent, don't send again
    if (messageData.emailNotificationSent) {
      console.log('Email already sent for message:', messageId);
      return false;
    }

    // Get conversation data to check online status
    const conversationDoc = await getDoc(doc(db, 'chatConversations', conversationId));
    
    if (!conversationDoc.exists()) {
      console.log('Conversation not found:', conversationId);
      return false;
    }

    const conversationData = conversationDoc.data();
    
    // Determine recipient based on sender
    const recipientField = sender === 'customer' ? 'businessOnline' : 'customerOnline';
    const isRecipientOnline = conversationData[recipientField] || false;
    
    // If recipient is offline, send email immediately
    if (!isRecipientOnline) {
      console.log('Recipient is offline, sending email notification');
      return true;
    }

    // If recipient is online, check if message has been unread for 10 minutes
    const messageCreatedAt = messageData.createdAt?.toMillis() || Date.now();
    const currentTime = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000;
    
    // Check if message is read
    if (messageData.readAt) {
      console.log('Message already read, no email needed');
      return false;
    }

    // If message is older than 10 minutes and still unread, send email
    if (currentTime - messageCreatedAt >= tenMinutesInMs) {
      console.log('Message unread for 10+ minutes, sending email notification');
      return true;
    }

    // Message is recent and recipient is online, don't send email yet
    console.log('Recipient is online and message is recent, skipping email');
    return false;

  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
}

/**
 * Mark that an email notification was sent for a message
 */
export async function markEmailNotificationSent(messageId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'chatMessages', messageId), {
      emailNotificationSent: true,
      emailNotificationSentAt: serverTimestamp()
    });
    
    console.log('✅ Marked email as sent for message:', messageId);
  } catch (error) {
    console.error('Error marking email as sent:', error);
  }
}

/**
 * Queue a delayed email notification (10-minute delay)
 */
export async function queueDelayedEmailNotification(
  messageId: string,
  conversationId: string,
  sender: 'customer' | 'business',
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messageText: string,
  widgetName?: string,
  businessName?: string
): Promise<void> {
  const TEN_MINUTES = 10 * 60 * 1000;

  // Set a timeout to check and send email after 10 minutes
  setTimeout(async () => {
    try {
      // Check if message has been read in the meantime
      const shouldSend = await shouldSendMessageNotification(messageId, conversationId, sender);
      
      if (shouldSend) {
        // Send the email
        const response = await fetch('/api/emails/message-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: sender === 'customer' ? 'business' : 'customer',
            recipientEmail,
            recipientName,
            senderName,
            messageText,
            conversationId,
            widgetName,
            businessName
          })
        });

        const result = await response.json();
        
        if (result.success) {
          // Mark email as sent
          await markEmailNotificationSent(messageId);
          console.log('✅ Delayed email notification sent for message:', messageId);
        } else {
          console.error('❌ Failed to send delayed email:', result.error);
        }
      } else {
        console.log('Message was read or email already sent, skipping delayed email');
      }
    } catch (error) {
      console.error('Error in delayed email notification:', error);
    }
  }, TEN_MINUTES);
  
  console.log(`⏰ Queued delayed email notification for message ${messageId} (will send in 10 min if unread)`);
}

/**
 * Send immediate email notification (for offline users)
 */
export async function sendImmediateEmailNotification(
  messageId: string,
  conversationId: string,
  sender: 'customer' | 'business',
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messageText: string,
  widgetName?: string,
  businessName?: string
): Promise<boolean> {
  try {
    // Check if we should send
    const shouldSend = await shouldSendMessageNotification(messageId, conversationId, sender);
    
    if (!shouldSend) {
      return false;
    }

    // Send the email
    const response = await fetch('/api/emails/message-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: sender === 'customer' ? 'business' : 'customer',
        recipientEmail,
        recipientName,
        senderName,
        messageText,
        conversationId,
        widgetName,
        businessName
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Mark email as sent
      await markEmailNotificationSent(messageId);
      console.log('✅ Immediate email notification sent for message:', messageId);
      return true;
    } else {
      console.error('❌ Failed to send immediate email:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending immediate email notification:', error);
    return false;
  }
}

/**
 * Main function to handle message notification
 * Decides whether to send immediately or queue for delayed sending
 */
export async function handleMessageNotification(params: {
  messageId: string;
  conversationId: string;
  sender: 'customer' | 'business';
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messageText: string;
  widgetName?: string;
  businessName?: string;
}): Promise<void> {
  try {
    const conversationDoc = await getDoc(doc(db, 'chatConversations', params.conversationId));
    
    if (!conversationDoc.exists()) {
      return;
    }

    const conversationData = conversationDoc.data();
    const recipientField = params.sender === 'customer' ? 'businessOnline' : 'customerOnline';
    const isRecipientOnline = conversationData[recipientField] || false;

    if (isRecipientOnline) {
      // Recipient is online, queue delayed email (will send if unread after 10 min)
      queueDelayedEmailNotification(
        params.messageId,
        params.conversationId,
        params.sender,
        params.recipientEmail,
        params.recipientName,
        params.senderName,
        params.messageText,
        params.widgetName,
        params.businessName
      );
    } else {
      // Recipient is offline, send email immediately
      await sendImmediateEmailNotification(
        params.messageId,
        params.conversationId,
        params.sender,
        params.recipientEmail,
        params.recipientName,
        params.senderName,
        params.messageText,
        params.widgetName,
        params.businessName
      );
    }
  } catch (error) {
    console.error('Error handling message notification:', error);
  }
}


