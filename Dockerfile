# Docker configuration for the Commuter admin
#
# To run:
#
# docker run -d -p 80:80 --name commuter-admin commuter/admin

FROM nginx

ENV app_destination /var/www/commuter-admin/

# Copy angular app to image
ADD dist/ $app_destination

# Configure nginx
RUN rm -f /etc/nginx/conf.d/*
ADD deployment/commuter-admin.conf /etc/nginx/conf.d/
ADD deployment/nginx.conf /etc/nginx/

