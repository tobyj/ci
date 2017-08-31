# note: this should never truly be refernced since we are using relative assets
http_path = "/skin/frontend/pacbrands/default/"
css_dir = "../css"
sass_dir = "../scss"
images_dir = "../images"
javascripts_dir = "../js"
relative_assets = true

# Fallback
add_import_path "."
#add_import_path "../../../rwd/enterprise/scss"
#add_import_path "../../../rwd/default/scss"

# Production
#output_style = :compressed
#environment = :production

# Development
output_style = :expanded
environment = :development
