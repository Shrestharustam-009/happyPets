const regex = /(?:<a[^>]*>)?(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^<]*)(?:<\/a>)?/gi;
console.log('https://youtu.be/959N2GZHlVY'.replace(regex, 'THUMB:'));
