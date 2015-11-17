require 'sinatra'
require 'haml'
require 'rdiscount'
require 'yaml'

projects = YAML.load_file('data/projects.yaml')['projects']
tool_colours = YAML.load_file('data/tools.yaml')

get '/' do
    @projects = projects
    haml :index
end

get '/:slug' do
    @tool_colours = tool_colours
    @project = projects.select {|p| p['slug'] == params['slug']}.first
    halt(404) unless !@project.nil?

    @other_projects = projects.sample(3)
    @other_projects.delete_if { |x| x == @project }

    @project_md = File.open("data/#{@project['slug']}.md").read
    haml :project
end

get '/assets/css/:name' do
    send_file('assets/css/'+params[:name])
end

get '/assets/images/:project/:name' do
    send_file('assets/images/'+params[:project]+'/'+params[:name])
end

get '/assets/images/:name' do
    send_file('assets/images/'+params[:name])
end

not_found do
    "Oops!"
end

