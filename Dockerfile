# docker run -d -p 80:80 --name docker-ide superafroman/docker-ide

FROM dockerfile/ubuntu

ENV DOCKER_IDE_MODE embedded

# Install Nginx extras (including lua and substitution modules).
RUN \
  add-apt-repository -y ppa:nginx/stable && \
  apt-get update && \
  apt-get install -y nginx-extras && \
  rm -rf /var/lib/apt/lists/* && \
  chown -R www-data:www-data /var/lib/nginx

# Add nginx user to users group so gain access to docker.sock
RUN usermod -a -G users www-data

# Copy angular app to image
ADD dist/ /var/www/docker-ide/

# Configure nginx
RUN rm -f /etc/nginx/conf.d/*
ADD package/docker-ide.conf /etc/nginx/conf.d/
ADD package/nginx.conf /etc/nginx/

EXPOSE 80

CMD ["nginx"]
