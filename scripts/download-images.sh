#!/bin/bash

# Create images directory if it doesn't exist
mkdir -p public/images

# Download images
curl -L -o public/images/retreat-event.jpg "https://www.pexels.com/download/pexels-mikhail-nilov-8851737/?w=800&h=600" 
curl -L -o public/images/junior-competition.jpg "https://www.pexels.com/download/pexels-andrea-piacquadio-3621104/?w=800&h=600" 
curl -L -o public/images/certification.jpg "https://www.pexels.com/download/pexels-rdne-stock-project-8617742/?w=800&h=600" 
curl -L -o public/images/event-fallback.jpg "https://www.pexels.com/download/pexels-cottonbro-studio-2834917/?w=800&h=600" 
curl -L -o public/images/contact-image-2.jpg "https://www.pexels.com/download/pexels-mart-production-8985517/?w=800&h=600" 
curl -L -o public/images/track-event.jpg "https://www.pexels.com/download/pexels-pixabay-34514/?w=800&h=600" 
curl -L -o public/images/coach-avatar.jpg "https://www.pexels.com/download/pexels-tima-miroshnichenko-6551144/?w=500&h=500" 
curl -L -o public/images/athlete-avatar.jpg "https://www.pexels.com/download/pexels-tima-miroshnichenko-6551141/?w=500&h=500" 
curl -L -o public/images/athlete-avatar2.jpg "https://www.pexels.com/download/pexels-tima-miroshnichenko-6551155/?w=500&h=500" 
curl -L -o public/images/athlete-avatar3.jpg "https://www.pexels.com/download/pexels-rodnae-productions-7991370/?w=500&h=500" 
curl -L -o public/images/profile-avatar.jpg "https://www.pexels.com/download/pexels-sam-kolder-2729899/?w=500&h=500" 
curl -L -o public/images/weather-sunny.png "https://www.pexels.com/download/pexels-irina-vasilievna-15591465/?w=100&h=100" 

echo "All images downloaded!" 