window.dataLayer = window.dataLayer || [];

const getOnMapButton = document.querySelector("#get-on-map");

getOnMapButton.addEventListener("click", () => {
  window.dataLayer.push({
    event: "get_company_on_map"
  });
});