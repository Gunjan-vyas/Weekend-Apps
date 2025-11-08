import { 
  getAllItems, 
  getItemById, 
  createItem,
  updateItem, 
  deleteItem
} from "../db";

export async function getAllWardrobeItems() {
  try {
    const items = await getAllItems();
    return Response.json({ success: true, data: items });
  } catch (error) {
    return Response.json(
      { success: false, error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function getWardrobeItemById(id: number) {
  try {
    const item = await getItemById(id);
    if (!item) {
      return Response.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }
    return Response.json({ success: true, data: item });
  } catch (error) {
    return Response.json(
      { success: false, error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function createWardrobeItem(body: any) {
  try {
    const {
      name,
      cloth_type,
      clothType,
      gsm,
      fabric,
      color,
      size,
      brand,
      purchase_date,
      purchaseDate,
      purchase_price,
      purchasePrice,
      condition,
      season,
      occasion,
      location,
      notes
    } = body;

    const finalClothType = cloth_type || clothType;
    if (!name || !finalClothType) {
      return Response.json(
        { success: false, error: "Name and cloth_type are required" },
        { status: 400 }
      );
    }

    const newItem = await createItem({
      name,
      clothType: finalClothType,
      gsm: gsm || null,
      fabric: fabric || null,
      color: color || null,
      size: size || null,
      brand: brand || null,
      purchaseDate: purchase_date || purchaseDate || null,
      purchasePrice: purchase_price || purchasePrice || null,
      condition: condition || null,
      season: season || null,
      occasion: occasion || null,
      location: location || null,
      notes: notes || null,
    });

    return Response.json({ success: true, data: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return Response.json(
      { success: false, error: "Failed to create item" },
      { status: 500 }
    );
  }
}

export async function updateWardrobeItem(id: number, body: any) {
  try {
    const existingItem = await getItemById(id);
    if (!existingItem) {
      return Response.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const {
      name,
      cloth_type,
      clothType,
      gsm,
      fabric,
      color,
      size,
      brand,
      purchase_date,
      purchaseDate,
      purchase_price,
      purchasePrice,
      condition,
      season,
      occasion,
      location,
      notes
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (cloth_type !== undefined || clothType !== undefined) updateData.clothType = cloth_type || clothType;
    if (gsm !== undefined) updateData.gsm = gsm;
    if (fabric !== undefined) updateData.fabric = fabric;
    if (color !== undefined) updateData.color = color;
    if (size !== undefined) updateData.size = size;
    if (brand !== undefined) updateData.brand = brand;
    if (purchase_date !== undefined || purchaseDate !== undefined) updateData.purchaseDate = purchase_date || purchaseDate;
    if (purchase_price !== undefined || purchasePrice !== undefined) updateData.purchasePrice = purchase_price || purchasePrice;
    if (condition !== undefined) updateData.condition = condition;
    if (season !== undefined) updateData.season = season;
    if (occasion !== undefined) updateData.occasion = occasion;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;

    const updatedItem = await updateItem(id, updateData);
    return Response.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error("Error updating item:", error);
    return Response.json(
      { success: false, error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function deleteWardrobeItem(id: number) {
  try {
    const existingItem = await getItemById(id);
    if (!existingItem) {
      return Response.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    await deleteItem(id);
    return Response.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    return Response.json(
      { success: false, error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

