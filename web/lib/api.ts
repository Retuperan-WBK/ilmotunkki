import qs from "qs";
export const getStrapiURL = (path = "") => {
  return `${
    process.env.STRAPI_API_URL || "http://cms:1337"
  }${path}`;
}

export const fetchAPI = async <T>(
  path: string,
  options: RequestInit = {},
  urlParamsObject = {},
  ): Promise<T> => {
  // Merge default and user options
  const mergedOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };
  const queryString = qs.stringify(urlParamsObject);
  // Build request URL
  const requestUrl = `${getStrapiURL(
    `/api${path}${queryString ? `?${queryString}` : ""}`
  )}`;
  // Trigger API call
  const response = await fetch(requestUrl, mergedOptions);
  // Handle response
  if (!response.ok) {
    const {error} = await response.json()
    throw error;
  }
  const {data} = await response.json();
  
  return data as T;
};

export type StrapiError = {
  status: number,
  name: string,
  message: string,
  details: string,
}

type Media = {
  data: {
    attributes: {
      url: string;
    }
  },
};

const getPublicStrapiURL = (path = "") => {
  return `${
    process.env.STRAPI_PUBLIC_URL
  }${path}`;
}

export const getStrapiMedia = (media: Media) => {
  const { url } = media.data.attributes;
  const imageUrl = url.startsWith("/") ? getPublicStrapiURL(url) : url;
  return imageUrl;
}

export const fetchLoginApi= async <T>(
  path: string,
  options: RequestInit = {},
  urlParamsObject = {},
  ): Promise<T> => {
  // Merge default and user options
  const mergedOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };
  const queryString = qs.stringify(urlParamsObject);
  // Build request URL
  const requestUrl = `${getStrapiURL(
    `/api${path}${queryString ? `?${queryString}` : ""}`
  )}`;
  // Trigger API call
  const response = await fetch(requestUrl, mergedOptions);
  // Handle response
  if (!response.ok) {
    const {error} = await response.json()
    throw error;
  }

  const data = await response.json();
  return data as T;
};

export const fetchAuthenticatedAPI = async <T>(
  path: string,
  options: RequestInit = {},
  urlParamsObject = {},
  jwt: string
): Promise<T> => {
  // Merge default options and user options
  const mergedOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`
    },
    ...options,
  };

  // Ensure the body is JSON serializable
  if (mergedOptions.body && typeof mergedOptions.body !== 'string') {
    mergedOptions.body = JSON.stringify(mergedOptions.body);
  }

  const queryString = qs.stringify(urlParamsObject);
  
  // Build the request URL
  const requestUrl = `${getStrapiURL(`/api${path}${queryString ? `?${queryString}` : ""}`)}`;

  // Trigger the API call
  const response = await fetch(requestUrl, mergedOptions);

  // Handle errors
  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse?.error?.message || 'An unknown error occurred.');
  }

  // Return the response data
  const jsonResponse = await response.json();

  // Check if the response has a data property
  if (jsonResponse.data !== undefined) {
    return jsonResponse.data as T;
  } else {
    return jsonResponse as T;
  }
}