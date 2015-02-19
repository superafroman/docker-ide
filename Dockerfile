# docker run -d -p 80:80 --name docker-ide superafroman/docker-ide

FROM nginx

# Copy angular app to image
ADD dist/ /var/www/docker-ide/

# Configure nginx
RUN rm -f /etc/nginx/conf.d/*
ADD package/docker-ide.conf /etc/nginx/conf.d/
ADD package/nginx.conf /etc/nginx/

