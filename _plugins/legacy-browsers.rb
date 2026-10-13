# After every build (including each rebuild under `jekyll serve`), lowers the site's JavaScript for
# older browsers. See scripts/legacy/transpile.mjs. Needs Node and `pnpm install`.
require "open3"

Jekyll::Hooks.register :site, :post_write do |site|
  script = File.join(site.source, "scripts", "legacy", "transpile.mjs")
  output, status = Open3.capture2e("node", script, site.dest, site.source, chdir: site.source)
  output.each_line { |line| Jekyll.logger.info "Legacy build:", line.chomp.sub(/^legacy build: /, "") }
  raise "Legacy browser build failed (see above)" unless status.success?
end
