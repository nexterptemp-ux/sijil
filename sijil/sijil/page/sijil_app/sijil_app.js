frappe.pages["sijil-app"].on_page_load = function (wrapper) {
	// The page is a single-page application; the Frappe page chrome is only a mount point.
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("Sijil"), single_column: true });
	page.main.addClass("sijil-mount");
	wrapper.page_obj = page;

	frappe.require(["sijil.bundle.css", "sijil.bundle.js"], () => {
		wrapper.sijil_app = new sijil.App(wrapper, page);
	});
};

frappe.pages["sijil-app"].on_page_show = function (wrapper) {
	if (wrapper.sijil_app) wrapper.sijil_app.route();
};
