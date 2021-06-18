FROM nginx:alpine

# support running as arbitrary user which belogs to the root group
RUN chmod g+rwx /var/cache/nginx /var/run /var/log/nginx && \
    chown nginx.root /var/cache/nginx /var/run /var/log/nginx && \
    # comment user directive as master process is run as user in OpenShift
    sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf 

COPY default.conf /etc/nginx/conf.d/

WORKDIR /usr/share/nginx/html/
EXPOSE 8081

USER nginx:root
