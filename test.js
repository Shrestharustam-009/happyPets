const regex = /(?:<a[^>]*>)?(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:<\/a>)?/gi;
const test1 = '<p><span style="color: red;">https://youtu.be/959N2GZHlVY</span></p>';
console.log(test1.replace(regex, 'EMBED:'));
