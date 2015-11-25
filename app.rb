require 'sinatra'
require 'tilt/haml'
require 'tilt/rdiscount'
require 'yaml'


class App < Sinatra::Base

  site_data = YAML.load_file('data/site.yaml')
  projects = YAML.load_file('data/projects.yaml')
  tool_colours = YAML.load_file('data/tools.yaml')

  get '/' do
      @site = site_data
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

  get '/assets/images/:slug/:file' do
      send_file('assets/images/'+params[:slug]+'/'+params[:file])
  end

  not_found do
      "Oops!"
  end

end

