#!/bin/bash

# Script to commit and push portfolio to GitHub
# Run this script: bash deploy-to-github.sh

cd "$(dirname "$0")"

echo "Initializing git repository..."
git init

echo "Adding remote repository..."
git remote add origin https://github.com/CaptainAarav/Portfolio-Page.git 2>/dev/null || git remote set-url origin https://github.com/CaptainAarav/Portfolio-Page.git

echo "Adding all files..."
git add .

echo "Committing files..."
git commit -m "Initial commit: Aviation/Tech portfolio with Docker setup for Raspberry Pi"

echo "Setting main branch..."
git branch -M main

echo "Pushing to GitHub..."
echo "Note: You may need to authenticate with GitHub (Personal Access Token or SSH)"
git push -u origin main

echo "Done!"
