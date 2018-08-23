import fetch from "node-fetch";
import config from "./configuration";

const catApiKey = config.get("catApiKey");

const baseUrl = "https://api.thecatapi.com/v1/";

const defaultSearchParams = {
  size: "med",
  mime_types: "jpg,png,gif",
  format: "json",
  has_breeds: false,
  order: "RANDOM",
  page: 0,
  limit: 5
};

/**
 * Search for images
 * @param {Object} [params]                                     Search parameters
 * @param {('thumb'|'small'|'med'|'full')} [params.size="med"]  Size of the image to return
 * @param {string} [params.mime_types="jpg,png,gif"]            Comma separated list of mime types to search for
 * @param {('json'|'src')} [params.format="json"]               Whether to return the image as a url or JSON
 * @param {boolean} [params.has_breeds=false]                   Only return images that have breed information
 * @param {('RANDOM'|'ASC'|'DESC')} [params.order="RANDOM"]     The order in which to return results
 * @param {number} [params.page=0]                              The page number to return
 * @param {number} [params.limit=5]                             The number of results to return
 */
export function searchImages(params) {
  const searchParams = new URLSearchParams(
    Object.assign({}, defaultSearchParams, params)
  );
  const url = new URL("images/search", baseUrl);
  url.search = searchParams.toString();

  return fetch(url.toString(), {
    headers: {
      "x-api-key": catApiKey
    }
  }).then(r => r.json());
}
