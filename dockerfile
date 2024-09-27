FROM mcr.microsoft.com/playwright:focal

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install browsers
RUN npx playwright install

# Copy script
COPY index.js .

# Set the entrypoint to the Node.js executable
ENTRYPOINT ["node", "index.js"]

# Default parameters
CMD ["npm", "start"]