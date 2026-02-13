const PEXELS_BASE_URL = "https://api.pexels.com/v1";

interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

export async function searchPexels(
  query: string,
  perPage = 3
): Promise<PexelsPhoto[]> {
  const res = await fetch(
    `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
    {
      headers: {
        Authorization: process.env.PEXELS_API_KEY!,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status}`);
  }

  const data: PexelsSearchResponse = await res.json();
  return data.photos;
}

export function formatPexelsAttribution(photo: PexelsPhoto) {
  return {
    url: photo.src.large,
    preview_url: photo.src.medium,
    attribution_text: `Photo by ${photo.photographer}`,
    attribution_url: photo.photographer_url,
    license_info: "Pexels License - Free to use",
    provider: "pexels" as const,
  };
}
