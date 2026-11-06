# After every build, makes the lossless WebP copies of the images in _data/images.yml (before the offline
# file list, _plugins/pwa.rb, which takes the small ones). See scripts/images/build.mjs. Needs Node and `pnpm install`.
require "json"
require "open3"

Jekyll::Hooks.register :site, :post_write, priority: :high do |site|
  script = File.join(site.source, "scripts", "images", "build.mjs")
  output, status = Open3.capture2e("node", script, site.dest, site.source,
                                   stdin_data: JSON.generate(site.data["images"] || {}), chdir: site.source)
  output.each_line { |line| Jekyll.logger.info "Images:", line.chomp.sub(/^images: /, "") }
  raise "Image copies failed (see above)" unless status.success?
end
