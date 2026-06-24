import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import path from "path"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

// Helper to determine if Cloudinary is configured
function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

// Upload buffer directly to Cloudinary
async function uploadToCloudinary(file, folder) {
  const buffer = await file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `happypets/${folder}`,
        resource_type: "auto"
      },
      (error, result) => {
        if (error) {
          console.error(`[Cloudinary] Upload failed for ${folder}:`, error)
          return reject(error)
        }
        resolve(result.secure_url)
      }
    )
    uploadStream.end(Buffer.from(buffer))
  })
}

// Delete asset from Cloudinary
async function deleteFromCloudinary(url) {
  try {
    if (!url || !url.startsWith("http")) return
    // Extract public ID from Cloudinary URL
    // e.g. https://res.cloudinary.com/cloud_name/image/upload/v12345/happypets/products/xyz.jpg
    const parts = url.split('/')
    const happypetsIndex = parts.findIndex(p => p === 'happypets')
    if (happypetsIndex !== -1) {
      const publicIdWithExtension = parts.slice(happypetsIndex).join('/')
      const lastDotIndex = publicIdWithExtension.lastIndexOf('.')
      const publicId = lastDotIndex !== -1 
        ? publicIdWithExtension.substring(0, lastDotIndex) 
        : publicIdWithExtension
      
      await cloudinary.uploader.destroy(publicId)
      console.log(`[Cloudinary] Deleted asset: ${publicId}`)
    }
  } catch (error) {
    console.error("[Cloudinary] Error deleting asset:", error)
  }
}

// ==========================================
// 1. PRODUCT IMAGES
// ==========================================
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products")
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function saveProductImage(file) {
  if (isCloudinaryConfigured()) {
    return await uploadToCloudinary(file, "products")
  }
  
  try {
    const buffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    const filepath = path.join(UPLOAD_DIR, filename)
    fs.writeFileSync(filepath, Buffer.from(buffer))
    return `/api/uploads/products/${filename}`
  } catch (error) {
    console.error("[v0] Error saving product image:", error)
    throw new Error("Failed to save image")
  }
}

export function deleteProductImage(imagePath) {
  if (isCloudinaryConfigured() && imagePath?.startsWith("http")) {
    deleteFromCloudinary(imagePath)
    return
  }

  try {
    if (!imagePath) return
    const filename = imagePath.split("/").pop()
    const filepath = path.join(UPLOAD_DIR, filename)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (error) {
    console.error("[v0] Error deleting product image:", error)
  }
}

// ==========================================
// 2. TEAM IMAGES
// ==========================================
const TEAM_UPLOAD_DIR = path.join(process.cwd(), "uploads", "team")
if (!fs.existsSync(TEAM_UPLOAD_DIR)) {
  fs.mkdirSync(TEAM_UPLOAD_DIR, { recursive: true })
}

export async function saveTeamImage(file) {
  if (isCloudinaryConfigured()) {
    return await uploadToCloudinary(file, "team")
  }

  try {
    const buffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    const filepath = path.join(TEAM_UPLOAD_DIR, filename)
    fs.writeFileSync(filepath, Buffer.from(buffer))
    return `/api/uploads/team/${filename}`
  } catch (error) {
    console.error("[v0] Error saving team image:", error)
    throw new Error("Failed to save team image")
  }
}

export function deleteTeamImage(imagePath) {
  if (isCloudinaryConfigured() && imagePath?.startsWith("http")) {
    deleteFromCloudinary(imagePath)
    return
  }

  try {
    if (!imagePath) return
    const filename = imagePath.split("/").pop()
    const filepath = path.join(TEAM_UPLOAD_DIR, filename)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (error) {
    console.error("[v0] Error deleting team image:", error)
  }
}

// ==========================================
// 3. HERO IMAGES
// ==========================================
const HERO_UPLOAD_DIR = path.join(process.cwd(), "uploads", "hero")
if (!fs.existsSync(HERO_UPLOAD_DIR)) {
  fs.mkdirSync(HERO_UPLOAD_DIR, { recursive: true })
}

export async function saveHeroImage(file) {
  if (isCloudinaryConfigured()) {
    return await uploadToCloudinary(file, "hero")
  }

  try {
    const buffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    const filepath = path.join(HERO_UPLOAD_DIR, filename)
    fs.writeFileSync(filepath, Buffer.from(buffer))
    return `/api/uploads/hero/${filename}`
  } catch (error) {
    console.error("[v0] Error saving hero image:", error)
    throw new Error("Failed to save hero image")
  }
}

export function deleteHeroImage(imagePath) {
  if (isCloudinaryConfigured() && imagePath?.startsWith("http")) {
    deleteFromCloudinary(imagePath)
    return
  }

  try {
    if (!imagePath) return
    const filename = imagePath.split("/").pop()
    const filepath = path.join(HERO_UPLOAD_DIR, filename)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (error) {
    console.error("[v0] Error deleting hero image:", error)
  }
}

// ==========================================
// 4. MISSION IMAGES
// ==========================================
const MISSION_UPLOAD_DIR = path.join(process.cwd(), "uploads", "mission")
if (!fs.existsSync(MISSION_UPLOAD_DIR)) {
  fs.mkdirSync(MISSION_UPLOAD_DIR, { recursive: true })
}

export async function saveMissionImage(file) {
  if (isCloudinaryConfigured()) {
    return await uploadToCloudinary(file, "mission")
  }

  try {
    const buffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    const filepath = path.join(MISSION_UPLOAD_DIR, filename)
    fs.writeFileSync(filepath, Buffer.from(buffer))
    return `/api/uploads/mission/${filename}`
  } catch (error) {
    console.error("[v0] Error saving mission image:", error)
    throw new Error("Failed to save mission image")
  }
}

export function deleteMissionImage(imagePath) {
  if (isCloudinaryConfigured() && imagePath?.startsWith("http")) {
    deleteFromCloudinary(imagePath)
    return
  }

  try {
    if (!imagePath) return
    const filename = imagePath.split("/").pop()
    const filepath = path.join(MISSION_UPLOAD_DIR, filename)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (error) {
    console.error("[v0] Error deleting mission image:", error)
  }
}

// ==========================================
// 5. CONSENT FORM ATTACHMENTS
// ==========================================
const CONSENT_UPLOAD_DIR = path.join(process.cwd(), "uploads", "consent-forms")
if (!fs.existsSync(CONSENT_UPLOAD_DIR)) {
  fs.mkdirSync(CONSENT_UPLOAD_DIR, { recursive: true })
}

export async function saveConsentAttachment(file) {
  if (isCloudinaryConfigured()) {
    return await uploadToCloudinary(file, "consent-forms")
  }

  try {
    const buffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    const filepath = path.join(CONSENT_UPLOAD_DIR, filename)
    fs.writeFileSync(filepath, Buffer.from(buffer))
    return `/api/uploads/consent-forms/${filename}`
  } catch (error) {
    console.error("[v0] Error saving consent attachment:", error)
    throw new Error("Failed to save attachment")
  }
}

export function deleteConsentAttachment(attachmentPath) {
  if (isCloudinaryConfigured() && attachmentPath?.startsWith("http")) {
    deleteFromCloudinary(attachmentPath)
    return
  }

  try {
    if (!attachmentPath) return
    const filename = attachmentPath.split("/").pop()
    const filepath = path.join(CONSENT_UPLOAD_DIR, filename)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (error) {
    console.error("[v0] Error deleting consent attachment:", error)
  }
}