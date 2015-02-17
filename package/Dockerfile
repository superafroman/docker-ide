# Docker configuration for the Commuter admin
#
# To run:
#
# docker run -d -p 80:80 --name commuter-admin commuter/admin

FROM nginx

# Copy angular app to image
ADD dist/ /var/www/docker-ide/

# Configure nginx
RUN rm -f /etc/nginx/conf.d/*
ADD deployment/docker-ide.conf /etc/nginx/conf.d/
ADD deployment/nginx.conf /etc/nginx/

