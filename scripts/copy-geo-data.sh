#!/bin/bash

# copy-geo-data.sh
#
# Copies suburb and bounds JSON files from scripts/geo to public/geo
# Excludes raw OSM JSON files (*.osm.json) and only copies processed data.
#
# Usage:
#   sh copy-geo-data.sh [OPTIONS]
#
# Options:
#   -v        Enable verbose output
#   -n        Dry run (show what would be copied without copying)
#
# Example:
#   sh copy-geo-data.sh -v
#   sh copy-geo-data.sh -n

# Default options
verbose=false
dry_run=false

# Print usage/help message
usage() {
    echo "Usage: $0 [-v] [-n]"
    echo "  -v: Enable verbose output"
    echo "  -n: Dry run (show what would be copied)"
    exit 1
}

# Parse command line options
while getopts "vn" opt; do
    case $opt in
    v)
        verbose=true
        ;;
    n)
        dry_run=true
        ;;
    *)
        usage
        ;;
    esac
done

# Define directories
script_dir="$(cd "$(dirname "$0")" && pwd)"
source_dir="${script_dir}/geo"
dest_dir="${script_dir}/../public/geo"

# Create destination directory if it doesn't exist
if [ "$dry_run" = false ]; then
    mkdir -p "$dest_dir"
    if [ "$verbose" = true ]; then
        echo "Ensured destination directory exists: $dest_dir"
    fi
fi

# Function to copy file
copy_file() {
    local src="$1"
    local dst="$2"
    
    if [ "$dry_run" = true ]; then
        echo "[DRY RUN] Would copy: $src -> $dst"
    else
        cp "$src" "$dst"
        if [ "$verbose" = true ]; then
            echo "Copied: $(basename "$src")"
        fi
    fi
}

# Counter for copied files
copied_count=0

# Copy all .suburbs.json and .bounds.json files (excluding .osm.json)
for file in "$source_dir"/*.suburbs.json "$source_dir"/*.bounds.json; do
    if [ -f "$file" ]; then
        # Skip if it's an OSM file
        if [[ "$file" == *.osm.json ]]; then
            continue
        fi
        
        filename=$(basename "$file")
        copy_file "$file" "$dest_dir/$filename"
        ((copied_count++))
    fi
done

# Print summary
echo ""
if [ "$dry_run" = true ]; then
    echo "✓ Dry run complete. Would copy $copied_count files."
else
    echo "✓ Successfully copied $copied_count files to $dest_dir"
fi
