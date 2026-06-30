const fs = require('fs');

const fixFile = (path, replaceMap) => {
  let code = fs.readFileSync(path, 'utf8');
  for (const [search, replace] of Object.entries(replaceMap)) {
    code = code.replace(search, replace);
  }
  fs.writeFileSync(path, code);
};

// Admin Tab Products
fixFile('components/admin-tabs/admin-tab-products.jsx', {
  'const [showForm, setShowForm] = useState(false)': 
  `const [showForm, setShowForm] = useState(false)

  const getImageUrl = (url) => {
    if (!url) return "/placeholder.svg";
    if (url.startsWith("http") || url.startsWith("/") || url.startsWith("blob:")) return url;
    if (url.startsWith("uploads/")) return "/" + url;
    return "/uploads/products/" + url;
  };`,
  'src={imagePreview || "/placeholder.svg"}': 'src={getImageUrl(imagePreview)}',
  'src={product.image_url || "/placeholder.svg"}': 'src={getImageUrl(product.image_url)}'
});

// Admin Tab Inventory
fixFile('components/admin-tabs/admin-tab-inventory.jsx', {
  'const [showUploadModal, setShowUploadModal] = useState(false)': 
  `const [showUploadModal, setShowUploadModal] = useState(false)

  const getImageUrl = (url) => {
    if (!url) return "/placeholder.svg";
    if (url.startsWith("http") || url.startsWith("/") || url.startsWith("blob:")) return url;
    if (url.startsWith("uploads/")) return "/" + url;
    return "/uploads/products/" + url;
  };`,
  'src={product.image_url}': 'src={getImageUrl(product.image_url)}',
  'src={formData.image_url}': 'src={getImageUrl(formData.image_url)}'
});
