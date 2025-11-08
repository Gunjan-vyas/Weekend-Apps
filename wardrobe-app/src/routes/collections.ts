import {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection
} from "../db";

export async function getAllCollectionsHandler() {
  try {
    const collections = await getAllCollections();
    return Response.json({ success: true, data: collections });
  } catch (error) {
    return Response.json(
      { success: false, error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

export async function getCollectionByIdHandler(id: number) {
  try {
    const collection = await getCollectionById(id);
    if (!collection) {
      return Response.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }
    return Response.json({ success: true, data: collection });
  } catch (error) {
    return Response.json(
      { success: false, error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

export async function createCollectionHandler(body: any) {
  try {
    const { name, description, item_ids, itemIds } = body;

    if (!name) {
      return Response.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const itemIdsString = Array.isArray(item_ids || itemIds) 
      ? (item_ids || itemIds).join(",") 
      : (item_ids || itemIds || "");

    const newCollection = await createCollection({
      name,
      description: description || null,
      itemIds: itemIdsString || null,
    });

    return Response.json({ success: true, data: newCollection }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: "Failed to create collection" },
      { status: 500 }
    );
  }
}

export async function updateCollectionHandler(id: number, body: any) {
  try {
    const existingCollection = await getCollectionById(id);
    if (!existingCollection) {
      return Response.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    const { name, description, item_ids, itemIds } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (item_ids !== undefined || itemIds !== undefined) {
      const itemIdsString = Array.isArray(item_ids || itemIds)
        ? (item_ids || itemIds).join(",")
        : (item_ids || itemIds);
      updateData.itemIds = itemIdsString;
    }

    const updatedCollection = await updateCollection(id, updateData);
    return Response.json({ success: true, data: updatedCollection });
  } catch (error) {
    return Response.json(
      { success: false, error: "Failed to update collection" },
      { status: 500 }
    );
  }
}

export async function deleteCollectionHandler(id: number) {
  try {
    const existingCollection = await getCollectionById(id);
    if (!existingCollection) {
      return Response.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    await deleteCollection(id);
    return Response.json({ success: true, message: "Collection deleted successfully" });
  } catch (error) {
    return Response.json(
      { success: false, error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}

