worker_processes 1
@app_path = '/var/www/clomax.me.uk/'

listen "#{@app_path}var/run/unicorn.sock", backlog: 64
pid "#{@app_path}var/run/unicorn.pid"
