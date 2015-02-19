# Docker IDE

Docker IDE is really just a simple editor for Dockerfiles that allows you to connect to a docker host and build your 
image as you configure it giving quick feedback.

You can see it running at http://superafroman.github.io/docker-ide

## Configure Docker to allow access

This is a proof-of-concept and so currently requires you to enable CORS in the Docker API.  You will also need to disable
TLS or add the docker URL as a trusted site in whatever browser you use.

### Enable CORS

*This is dangerous if the daemon is accessible to the public network.*

Start the Docker deamon with `--api-enable-cors`

For boot2docker do:

```sh
$ boot2docker ssh
docker@boot2docker:~$ sudo su -
root@boot2docker:/home/docker# echo 'EXTRA_ARGS="--api-enable-cors"' >> /var/lib/boot2docker/profile
root@boot2docker:/home/docker# exit
docker@boot2docker:~$ exit
$ boot2docker restart
```

### Disable TLS

`export DOCKER_TLS=no` and restart the Docker daemon.

For boot2docker do:

```sh
$ boot2docker ssh
docker@boot2docker:~$ sudo su -
root@boot2docker:/home/docker# echo 'DOCKER_TLS=no' >> /var/lib/boot2docker/profile
root@boot2docker:/home/docker# exit
docker@boot2docker:~$ exit
$ boot2docker restart
```
