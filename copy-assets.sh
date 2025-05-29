#!/bin/bash

# Remove symlinks if they exist
rm -f src/kenney_blocky-characters src/kenney_city-kit-commercial_20

# Copy assets directly
echo "Copying Kenney assets to src folder..."
cp -r kenney_blocky-characters src/
cp -r kenney_city-kit-commercial_20 src/

echo "Assets copied successfully!"
echo "Please restart your development server." 