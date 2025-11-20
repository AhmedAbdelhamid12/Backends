#!/bin/bash

# MongoDB Atlas Migration Script for Academy Multi M

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    if ! command -v mongodump &> /dev/null; then
        echo -e "${RED}Error: mongodump is not installed${NC}"
        echo "Please install MongoDB Database Tools"
        exit 1
    fi

    if ! command -v mongorestore &> /dev/null; then
        echo -e "${RED}Error: mongorestore is not installed${NC}"
        echo "Please install MongoDB Database Tools"
        exit 1
    fi
}

# Function to prompt for input
prompt_input() {
    local prompt_message="$1"
    local var_name="$2"
    
    while true; do
        read -p "$prompt_message" input
        if [ -n "$input" ]; then
            eval "$var_name=\$input"
            break
        else
            echo -e "${RED}Error: Input cannot be empty${NC}"
        fi
    done
}

# Main migration function
migrate_to_atlas() {
    echo -e "${GREEN}=== MongoDB Atlas Migration for Academy Multi M ===${NC}"
    
    # Get source database details
    prompt_input "Enter source MongoDB host (default: localhost): " SOURCE_HOST
    SOURCE_HOST=${SOURCE_HOST:-"localhost"}
    
    prompt_input "Enter source MongoDB port (default: 27017): " SOURCE_PORT
    SOURCE_PORT=${SOURCE_PORT:-"27017"}
    
    prompt_input "Enter source database name: " SOURCE_DB
    
    # Get Atlas connection details
    prompt_input "Enter Atlas connection string: " ATLAS_URI
    
    prompt_input "Enter Atlas database name (default: academy-multim): " ATLAS_DB
    ATLAS_DB=${ATLAS_DB:-"academy-multim"}
    
    echo -e "${YELLOW}Starting migration process...${NC}"
    
    # Create backup directory
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_DIR="backup_$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    echo -e "${YELLOW}Creating backup of local database...${NC}"
    
    # Dump local database
    mongodump --host "$SOURCE_HOST" --port "$SOURCE_PORT" --db "$SOURCE_DB" --out "$BACKUP_DIR"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to create backup${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Backup created successfully in $BACKUP_DIR${NC}"
    
    # Restore to Atlas
    echo -e "${YELLOW}Restoring to MongoDB Atlas...${NC}"
    
    mongorestore --uri "$ATLAS_URI" --drop "$BACKUP_DIR/$SOURCE_DB"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to restore to Atlas${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Migration completed successfully!${NC}"
    echo -e "${GREEN}Database migrated from $SOURCE_HOST:$SOURCE_PORT/$SOURCE_DB to Atlas/$ATLAS_DB${NC}"
    
    # Update environment variables
    echo -e "${YELLOW}Updating environment variables...${NC}"
    
    # Create or update .env file
    if [ ! -f ".env" ]; then
        cp .env.example .env
    fi
    
    # Update MONGO_URI in .env file
    sed -i.bak "s|MONGO_URI=.*|MONGO_URI=$ATLAS_URI|" .env
    sed -i.bak "s|MONGO_URI_ATLAS=.*|MONGO_URI_ATLAS=$ATLAS_URI|" .env
    
    echo -e "${GREEN}Environment variables updated successfully!${NC}"
    echo -e "${YELLOW}Please verify the .env file contains the correct Atlas connection string${NC}"
}

# Run dependency check
check_dependencies

# Run migration
migrate_to_atlas

echo -e "${GREEN}=== Migration Process Complete ===${NC}"