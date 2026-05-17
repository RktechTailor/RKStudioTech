"use client";

import {
  Alert,
  alpha,
  CircularProgress,
  Box,
  Button,
  Card,
  CardContent,
  InputLabel,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import Grid from "@mui/material/Grid2";
import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import RKStudioLogo from "@/components/common/RKStudioLogo";
import Layout from "@/components/layout/Layout";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useProducts } from "@/hooks/useProducts";
import {
  addProduct,
  CatalogProduct,
  ProductCategory,
  removeProduct,
  uploadProductImage,
  updateProduct,
} from "@/services/productService";

type FormState = {
  name: string;
  price: string;
  type: string;
  category: ProductCategory;
  image: string;
  tag: string;
  discountPercent: string;
  rating: string;
};

const initialForm: FormState = {
  name: "",
  price: "",
  type: "",
  category: "fabric",
  image: "",
  tag: "daily wear",
  discountPercent: "0",
  rating: "4.5",
};

const MAX_UPLOAD_MB = 8;
const TARGET_MAX_SIDE = 1400;
const TARGET_QUALITY = 0.8;

const compressImageFile = async (file: File): Promise<File> => {
  if (file.size <= 350 * 1024) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Unable to read image."));
      element.src = imageUrl;
    });

    const ratio = Math.min(1, TARGET_MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * ratio));
    canvas.height = Math.max(1, Math.round(img.height * ratio));

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return file;
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", TARGET_QUALITY);
    });

    if (!blob) {
      return file;
    }

    const compressedName = file.name.replace(/\.[^.]+$/, "") + "-compressed.jpg";
    return new File([blob], compressedName, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

export default function AdminProductsManagement() {
  const { trackAsync } = useGlobalLoading();
  const { products, loading, error: productsError } = useProducts();
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [draggingImage, setDraggingImage] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState("");

  const submitLabel = useMemo(() => (editingId ? "Update Product" : "Add Product"), [editingId]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setForm(initialForm);
    setEditingId("");
    setImagePreview("");
    setCompressionInfo("");
  };

  const clearSelectedImage = () => {
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setField("image", "");
    setImagePreview("");
    setCompressionInfo("");
  };

  const validate = () => {
    if (!form.name.trim() || !form.price || !form.type.trim() || !form.image.trim() || !form.tag.trim()) {
      return "Please fill all fields.";
    }

    if (Number.isNaN(Number(form.price)) || Number(form.price) <= 0) {
      return "Price must be a valid positive amount.";
    }

    if (Number.isNaN(Number(form.discountPercent)) || Number(form.discountPercent) < 0 || Number(form.discountPercent) > 90) {
      return "Discount must be between 0 and 90.";
    }

    if (Number.isNaN(Number(form.rating)) || Number(form.rating) < 0 || Number(form.rating) > 5) {
      return "Rating must be between 0 and 5.";
    }

    return "";
  };

  const handleSubmit = async () => {
    setError("");
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        type: form.type.trim().toLowerCase(),
        category: form.category,
        image: form.image.trim(),
        tag: form.tag.trim(),
        discountPercent: Number(form.discountPercent),
        rating: Number(form.rating),
      };

      if (editingId) {
        await trackAsync(updateProduct(editingId, payload));
        setNotice("Product updated.");
      } else {
        await trackAsync(addProduct(payload));
        setNotice("Product added.");
      }

      resetForm();
    } catch {
      setError("Could not save product. Check Firebase configuration.");
    } finally {
      setSaving(false);
    }
  };

  const processSelectedImage = async (file: File) => {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`Please upload an image smaller than ${MAX_UPLOAD_MB}MB.`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setError("");
    setUploadingImage(true);

    try {
      const compressed = await compressImageFile(file);

      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }

      setImagePreview(URL.createObjectURL(compressed));

      if (compressed.size < file.size) {
        const fromKb = Math.round(file.size / 1024);
        const toKb = Math.round(compressed.size / 1024);
        setCompressionInfo(`Compressed from ${fromKb}KB to ${toKb}KB before upload.`);
      } else {
        setCompressionInfo("Image kept at original quality.");
      }

      const uploadedUrl = await trackAsync(uploadProductImage(compressed));
      setField("image", uploadedUrl);
      setNotice("Image uploaded successfully.");
    } catch {
      setError("Image upload failed. Check Firebase Storage setup.");
      setImagePreview("");
      setCompressionInfo("");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await processSelectedImage(file);
    event.target.value = "";
  };

  const handleImageDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDraggingImage(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await processSelectedImage(file);
  };

  const handleEdit = (product: CatalogProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      type: product.type,
      category: product.category,
      image: product.image,
      tag: product.tag,
      discountPercent: String(product.discountPercent || 0),
      rating: String(product.rating || 4.5),
    });

    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(product.image);
    setCompressionInfo("");
  };

  const handleDelete = async (id: string) => {
    setError("");

    try {
      await trackAsync(removeProduct(id));
      setNotice("Product deleted.");
      if (editingId === id) {
        resetForm();
      }
    } catch {
      setError("Could not delete product.");
    }
  };

  return (
    <Layout>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack spacing={1.2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
                <RKStudioLogo size={34} variant="full" />
                <Stack spacing={0.35}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Typography variant="h4">Admin Product Management</Typography>
                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.5,
                        borderRadius: 999,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "primary.main",
                        bgcolor: alpha("#DBEAFE", 0.95),
                        border: `1px solid ${alpha("#93C5FD", 0.48)}`,
                      }}
                    >
                      Brand Catalog Studio
                    </Box>
                  </Stack>
                  <Typography color="text.secondary">Add and manage fabric/dupatta products from Firestore.</Typography>
                </Stack>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Upload your real RK Studio product photos here. The image will be compressed, uploaded to Firebase Storage, and linked automatically.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {productsError ? <Alert severity="warning">{productsError}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        {notice ? <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert> : null}

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Add Product</Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Name" value={form.name} onChange={(e) => setField("name", e.target.value)} fullWidth />
                <TextField label="Price (INR)" type="number" value={form.price} onChange={(e) => setField("price", e.target.value)} fullWidth />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Discount %" type="number" value={form.discountPercent} onChange={(e) => setField("discountPercent", e.target.value)} fullWidth />
                <TextField label="Rating (0-5)" type="number" inputProps={{ min: 0, max: 5, step: 0.1 }} value={form.rating} onChange={(e) => setField("rating", e.target.value)} fullWidth />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Type" value={form.type} onChange={(e) => setField("type", e.target.value)} fullWidth />
                <TextField select label="Category" value={form.category} onChange={(e) => setField("category", e.target.value)} fullWidth>
                  <MenuItem value="fabric">Fabric</MenuItem>
                  <MenuItem value="dupatta">Dupatta</MenuItem>
                </TextField>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Tag" value={form.tag} onChange={(e) => setField("tag", e.target.value)} fullWidth />
                <Stack spacing={1.2} sx={{ width: "100%" }}>
                  <InputLabel sx={{ color: "text.secondary" }}>Product Image</InputLabel>
                  <Box
                    component="label"
                    onDrop={handleImageDrop}
                    onDragOver={(event: DragEvent<HTMLLabelElement>) => {
                      event.preventDefault();
                      setDraggingImage(true);
                    }}
                    onDragLeave={() => setDraggingImage(false)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `1px dashed ${draggingImage ? "#1E3A8A" : "#CBD5E1"}`,
                      backgroundColor: draggingImage ? alpha("#1E3A8A", 0.08) : alpha("#FFFFFF", 0.8),
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <CloudUploadOutlinedIcon color={draggingImage ? "primary" : "action"} />
                    <Typography variant="body2" color="text.secondary">
                      {uploadingImage ? "Uploading image..." : "Drag and drop an image here or click to browse"}
                    </Typography>
                    <input hidden type="file" accept="image/*" onChange={handleImageFileChange} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Best results: portrait product photo, under 8MB, clear fabric/dupatta close-up.
                  </Typography>
                  {uploadingImage ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={18} />
                      <Typography variant="body2" color="text.secondary">Uploading to Firebase Storage...</Typography>
                    </Stack>
                  ) : null}
                  {compressionInfo ? (
                    <Typography variant="caption" color="text.secondary">{compressionInfo}</Typography>
                  ) : null}
                  {form.image ? (
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                      Stored URL: {form.image}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>

              {imagePreview ? (
                <Stack spacing={1.2} alignItems="flex-start">
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Product preview"
                    sx={{ width: 170, height: 170, objectFit: "cover", borderRadius: 2, border: "1px solid #E5E7EB" }}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" component="label" size="small" disabled={uploadingImage}>
                      Replace image
                      <input hidden type="file" accept="image/*" onChange={handleImageFileChange} />
                    </Button>
                    <Button variant="text" color="error" size="small" onClick={clearSelectedImage} disabled={uploadingImage}>
                      Remove image
                    </Button>
                  </Stack>
                </Stack>
              ) : null}

              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleSubmit} disabled={saving || uploadingImage}>
                  {saving ? "Saving..." : submitLabel}
                </Button>
                {editingId ? (
                  <Button variant="outlined" onClick={resetForm}>Cancel Edit</Button>
                ) : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PhotoLibraryOutlinedIcon color="primary" />
                <Typography variant="h5">Quick Product Gallery</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Use this gallery to quickly scan products and jump into edit mode for image replacement or pricing updates.
              </Typography>

              <Grid container spacing={2}>
                {products.map((product) => (
                  <Grid key={`gallery-${product.id}`} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Card sx={{ height: "100%" }}>
                      <Box
                        component="img"
                        src={product.image}
                        alt={product.name}
                        sx={{ width: "100%", height: 180, objectFit: "cover" }}
                      />
                      <CardContent>
                        <Stack spacing={1.1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {product.category} | {product.type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Discount: {product.discountPercent || 0}% | Rating: {(product.rating || 0).toFixed(1)}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditOutlinedIcon />}
                            onClick={() => handleEdit(product)}
                          >
                            Edit This Product
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}

                {!loading && products.length === 0 ? (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info">No products available in the gallery yet.</Alert>
                  </Grid>
                ) : null}
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Products</Typography>

              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Discount</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Tag</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>INR {product.price}</TableCell>
                        <TableCell>{product.discountPercent || 0}%</TableCell>
                        <TableCell>{(product.rating || 0).toFixed(1)}</TableCell>
                        <TableCell>{product.type}</TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>{product.category}</TableCell>
                        <TableCell>{product.tag}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="outlined" onClick={() => handleEdit(product)}>Edit</Button>
                            <Button size="small" color="error" onClick={() => handleDelete(product.id)}>Delete</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}

                    {!loading && products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>No products found.</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Layout>
  );
}
