require 'json'
require 'pp'
require 'open-uri'
require 'timeout'


## just get as much as we need of the stream - 20 secs in this case

def getPartialBinary(url, name, secs)

  cwd = File.expand_path(File.dirname(__FILE__))

  full_path =  File.join(cwd, "../stations/#{name}.mp3")

  cmd = "curl \"#{url}\" > #{full_path}"

  res = ""
  begin
    status = Timeout::timeout(secs) {
     res = `#{cmd}`
    }
  rescue Exception=>e
    puts "done - killing"
    `killall curl`
  end

end


# get an image for a programme

def getPidImage(url, pid)

  secs = 40
  cwd = File.expand_path(File.dirname(__FILE__))

  full_path =  File.join(cwd, "../images/#{pid}.jpg")

  cmd = "curl \"#{url}\" > #{full_path}"

  res = ""
  begin
    status = Timeout::timeout(secs) {
     res = `#{cmd}`
    }
  rescue Exception=>e
    puts "done - killing"
    `killall curl`
  end

end


## get logo

def getLogoImage(url, logo_type, fn)

  secs = 40
  cwd = File.expand_path(File.dirname(__FILE__))

  full_path =  File.join(cwd, "../images/logos/radio/#{logo_type}/#{fn}.svg")

  cmd = "curl \"#{url}\" > #{full_path}"

  res = ""
  begin
    status = Timeout::timeout(secs) {
     res = `#{cmd}`
    }
  rescue Exception=>e
    puts "done - killing"
    `killall curl`
  end

end





# first get the services and station files

`curl http://bbc.services.radiodan.net/services.json > services.json`
`curl http://bbc.services.radiodan.net/stations.json > stations.json`

secs = 20

services_fn = "services.json"

f = File.read(services_fn)
j = JSON.parse(f)
services = j["services"]


# we need to
# find the playlist, rewrite it (image and playlist) and save it
# get the stream id and save a minute of it in /media/music/ under the name of the service
# grab the pid image and put it somewhere
    
cwd = File.expand_path(File.dirname(__FILE__))

services.each do |service|

    i =  service["id"]
    puts i

# download the images and rewrite the url
	
    im =  service["nowAndNext"][0]["image"]["templateUrl"]
    im_pid =  service["nowAndNext"][0]["image"]["id"]
    puts im
    im = im.gsub("$recipe","272x153");
    getPidImage(im, im_pid)
    service["nowAndNext"][0]["image"]["templateUrl"] =   "http://radiodan.local/services/images/#{im_pid}.jpg"

# download a mminute of content
    p =  service["playlist"]
    puts p
# get the playlist content
    open(p) do |f|
      page_string = f.read
#      puts page_string
      arr = page_string.split("\n")
      arr.each do |a|
        if(m = a.match(/^File1.*?\=(http\:.*$)/))
           if(m[1]&& m[1]!="")
              download_url = m[1]
              getPartialBinary(download_url,i,secs)
           end
        end
      end
    end


# getthe playlist
    text = "[playlist]
NumberOfEntries=1
File1=http://radiodan.local/services/stations/#{i}.mp3
Title1=No Title
Length1=-1
"
    full_path =  File.join(cwd, "../playlists/#{i}.pls")
    service["playlist"] = "http://radiodan.local/services/playlists/#{i}.pls"
    File.open(full_path, 'w') { |file| file.write(text) }


end


# serialise services

fp = File.join(cwd, "../#{services_fn}")
str = JSON.pretty_generate(j)
File.open(fp, 'w') { |file| file.write(str) }


## statiosn
## grab the svgs, rewrite the urls and copy the statsions.json to the right place


stations_fn = "stations.json"

f = File.read(stations_fn)
j = JSON.parse(f)
stations = j["stations"]


# we need to get the station logos, cache them locally and then change the config file
    
cwd = File.expand_path(File.dirname(__FILE__))

stations.each do |station|

    i =  station["id"]
    puts i

# download the images and rewrite their urls

    logo_active =  station["logos"]["active"]

    getLogoImage(logo_active, "active", i)

    logo_inactive =  station["logos"]["inactive"]

    getLogoImage(logo_inactive, "inactive", i)

    station["logos"]["active"] = "http://radiodan.local/services/images/logos/radio/active/#{i}.svg"
    station["logos"]["inactive"] = "http://radiodan.local/services/images/logos/radio/inactive/#{i}.svg"

end

# serialise stations

fp = File.join(cwd, "../#{stations_fn}")
str = JSON.pretty_generate(j)
File.open(fp, 'w') { |file| file.write(str) }

# remove old files

File.delete(services_fn)
File.delete(stations_fn)
