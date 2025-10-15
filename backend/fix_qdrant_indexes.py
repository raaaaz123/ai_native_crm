"""Add missing payload indexes to Qdrant collection"""
from qdrant_client import QdrantClient

# Your Qdrant credentials
qdrant_client = QdrantClient(
    url="https://44cce1a4-277d-4473-b8d3-728cebfc6e09.europe-west3-0.gcp.cloud.qdrant.io:6333", 
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.emYstnqSd1WnWluwbdbXxFOkJpe27HEAGanXyrfJm7A",
)

collection_name = "rexa-engage"

print("=" * 60)
print("ADDING PAYLOAD INDEXES TO QDRANT COLLECTION")
print("=" * 60)

# Create index for widgetId
try:
    print("\nCreating payload index for 'widgetId'...")
    qdrant_client.create_payload_index(
        collection_name=collection_name,
        field_name="widgetId",
        field_schema="keyword"
    )
    print("✅ Created payload index for 'widgetId'")
except Exception as e:
    if "already exists" in str(e).lower():
        print("✅ Payload index for 'widgetId' already exists")
    else:
        print(f"❌ Error creating widgetId index: {e}")

# Create index for businessId
try:
    print("\nCreating payload index for 'businessId'...")
    qdrant_client.create_payload_index(
        collection_name=collection_name,
        field_name="businessId",
        field_schema="keyword"
    )
    print("✅ Created payload index for 'businessId'")
except Exception as e:
    if "already exists" in str(e).lower():
        print("✅ Payload index for 'businessId' already exists")
    else:
        print(f"❌ Error creating businessId index: {e}")

# Verify indexes were created
print("\n" + "=" * 60)
print("VERIFYING COLLECTION INFO")
print("=" * 60)
try:
    collection_info = qdrant_client.get_collection(collection_name)
    print(f"\nCollection: {collection_name}")
    print(f"Total Points: {collection_info.points_count}")
    print(f"Vector Size: {collection_info.config.params.vectors.size}")
    
    if collection_info.payload_schema:
        print(f"\nPayload Schema:")
        for field, schema in collection_info.payload_schema.items():
            print(f"  - {field}: {schema}")
    else:
        print("\nNo payload schema information available")
        
except Exception as e:
    print(f"Error getting collection info: {e}")

print("\n" + "=" * 60)
print("✅ DONE! Indexes created successfully.")
print("=" * 60)
print("\nYou can now restart your backend and test the AI chat!")

