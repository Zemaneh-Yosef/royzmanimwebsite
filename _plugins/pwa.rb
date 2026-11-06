# After every build (and after the legacy build, _plugins/legacy-browsers.rb), fills in the service
# worker's offline file list and version. See scripts/pwa/precache.mjs. Needs Node and `pnpm install`.
require "open3"

Jekyll::Hooks.register :site, :post_write, priority: :low do |site|
  script = File.join(site.source, "scripts", "pwa", "precache.mjs")
  output, status = Open3.capture2e("node", script, site.dest, site.source, chdir: site.source)
  output.each_line { |line| Jekyll.logger.info "Offline files:", line.chomp.sub(/^pwa: /, "") }
  raise "Offline file list failed (see above)" unless status.success?
end
