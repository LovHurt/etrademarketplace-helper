import axios from "axios";
import { promises as fsPromises } from "fs";
import * as path from "path";
import dotenv from 'dotenv';


interface Category {
  id: number;
  name: string;
  filters: any;
  hasSubcategory: boolean;
}

// Fetch the authentication token
export const fetchToken = async (): Promise<string> => {
  const apiId = process.env.API_ID;
  const apiSecret = process.env.API_SECRET;
  const baseUrl = process.env.BASE_URL;

  if (!apiId || !apiSecret || !baseUrl) {
    throw new Error("Missing required environment variables.");
  }

  const url = `${baseUrl}/Account/Token?apiId=${apiId}&apiSecret=${apiSecret}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = response.data;

    if (!data.token) {
      throw new Error("Token not found in response");
    }

    return `Bearer ${data.token}`;
  } catch (error: any) {
    throw new Error(`Token fetch failed: ${error.message}`);
  }
};

// Fetch categories from the API
export const fetchCategories = async (
  token: string,
  categoryId?: number | null
): Promise<Category[]> => {
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error("BASE_URL is not defined in environment variables.");
  }

  // Construct URL with categoryId as a query parameter if provided
  const url = categoryId
    ? `${baseUrl}/Category/List?categoryId=${categoryId}`
    : `${baseUrl}/Category/List`;

  try {
    // Prepare headers consistent with the working curl example
    const headers: any = {
      'Authorization': token,
      'Accept': 'application/octet-stream', // As per your curl example
    };

    // If categoryId is provided, send an empty body. Otherwise, send no body.
    const data = categoryId ? '' : undefined;

    const response = await axios.post(url, data, { headers });

    if (response.status !== 200) {
      throw new Error(`Categories fetch failed with status: ${response.status}`);
    }

    // Normalize the hasSubcategory field to boolean
    const responseData: Category[] = response.data.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      filters: cat.filters,
      hasSubcategory: cat.hasSubcategory === true || cat.hasSubcategory === 'true',
    }));

    return responseData;
  } catch (error: any) {
    console.error(`Categories fetch failed for categoryId=${categoryId}:`, error.message);
    throw new Error(`Categories fetch failed: ${error.message}`);
  }
};

// Recursively fetch all categories and their subcategories
export const fetchAllCategories = async (
  token: string,
  categoryId?: number,
  visitedCategories: Set<number> = new Set()
): Promise<Category[]> => {
  if (categoryId !== undefined && categoryId !== null) {
    if (visitedCategories.has(categoryId)) {
      return [];
    }
    visitedCategories.add(categoryId);
  } else {
    // Use a special identifier for the root call to prevent adding undefined/null
    if (visitedCategories.has(0)) {
      return [];
    }
    visitedCategories.add(0);
  }

  try {
    // Fetch categories based on the current categoryId
    const categories = await fetchCategories(token, categoryId);
    console.log(
      `Fetched categories for categoryId=${categoryId !== undefined && categoryId !== null ? categoryId : "root"}:`,
      categories.map(cat => ({ id: cat.id, name: cat.name, hasSubcategory: cat.hasSubcategory }))
    );

    let allCategories = [...categories];

    // Iterate through each category to check for subcategories
    for (const category of categories) {
      console.log(`Category ID=${category.id} hasSubcategory=${category.hasSubcategory}`);
      if (category.hasSubcategory) {
        const subCategories = await fetchAllCategories(
          token,
          category.id,
          visitedCategories
        );
        allCategories = [...allCategories, ...subCategories];
      }
    }

    const uniqueCategories = Array.from(
      new Map(allCategories.map((cat) => [cat.id, cat])).values()
    );

    return uniqueCategories;
  } catch (error: any) {
    console.error(`Error fetching categories for categoryId=${categoryId}:`, error.message);
    throw error;
  }
};

export const saveCategoriesToFile = async (categories: Category[]) => {
  try {
    const simplifiedCategories = categories.map(({ id, name }) => ({ id, name }));

    // Log the number of categories and the total characters in the JSON string
    const jsonData = JSON.stringify(simplifiedCategories, null, 2);
    console.log(`Total categories to save: ${simplifiedCategories.length}`);
    console.log(`JSON data length: ${jsonData.length} characters`);

    // Define file paths
    const tempFilePath = path.resolve(__dirname, 'all_categories_temp.json');
    const finalFilePath = path.resolve(__dirname, 'all_categories.json');

    console.log(`Saving ${simplifiedCategories.length} categories to temporary file at ${tempFilePath}...`);

    // Write to a temporary file first
    await fsPromises.writeFile(
      tempFilePath,
      jsonData,
      "utf-8"
    );

    // Rename the temporary file to the final file
    await fsPromises.rename(tempFilePath, finalFilePath);

    console.log(`All categories (id and name) saved to ${finalFilePath}`);
  } catch (error: any) {
    console.error("Failed to save categories to file:", error.message);
    throw error;
  }
};