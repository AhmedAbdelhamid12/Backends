#!/bin/bash

# MongoDB Atlas Migration Script
# Academy Multi M - Migrate from local MongoDB to MongoDB Atlas

set -e

echo "=========================================="
echo "MongoDB Atlas Migration Tool"
echo "Academy Multi M"
echo "=========================================="
echo ""

# Check if mongodump and mongorestore are installed
if ! command -v mongodump &> /dev/null; then
    echo "❌ Error: mongodump is not installed"
    echo "Please install MongoDB tools: https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

if ! command -v mongorestore &> /dev/null; then
    echo "❌ Error: mongorestore is not installed"
    echo "Please install MongoDB tools: https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

echo "✅ MongoDB tools found"
echo ""

# Step 1: Create backup from local MongoDB
echo "📦 Step 1: Creating backup from local MongoDB..."
BACKUP_DIR="./mongodb-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

mongodump \
  --uri "mongodb://localhost:27017/academy-multi-m" \
  --out "$BACKUP_DIR" \
  --forceTableScan

echo "✅ Backup created: $BACKUP_DIR"
echo ""

# Step 2: Get MongoDB Atlas connection string
echo "📝 Step 2: MongoDB Atlas Connection String"
echo "================================================"
echo "You can find your connection string in MongoDB Atlas:"
echo "1. Go to: https://cloud.mongodb.com"
echo "2. Click 'Connect' on your cluster"
echo "3. Choose 'Connect your application'"
echo "4. Copy the connection string"
echo "================================================"
echo ""
read -p "Enter your MongoDB Atlas connection string: " ATLAS_URI

if [ -z "$ATLAS_URI" ]; then
    echo "❌ No connection string provided"
    exit 1
fi

# Step 3: Restore to Atlas
echo ""
echo "🔄 Step 3: Restoring data to MongoDB Atlas..."
echo "This may take a few minutes depending on data size..."

mongorestore \
  --uri "$ATLAS_URI" \
  --dir "$BACKUP_DIR/academy-multi-m" \
  --drop

if [ $? -eq 0 ]; then
    echo "✅ Data successfully restored to MongoDB Atlas"
else
    echo "❌ Restore failed. Please check your connection string."
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Migration Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Update .env file with your Atlas URI:"
echo "   MONGODB_URI=$ATLAS_URI"
echo ""
echo "2. Update environment variables:"
echo "   export MONGODB_URI=\"$ATLAS_URI\""
echo ""
echo "3. Restart your application:"
echo "   npm restart"
echo ""
echo "4. Backup location: $BACKUP_DIR"
echo "   Keep this as a recovery point"
echo ""
echo "Documentation: https://docs.mongodb.com/"
