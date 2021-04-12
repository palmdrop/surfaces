const camelToTitle = (camelCase) => camelCase
  .replace(/([A-Z])/g, (match) => ` ${match}`)
  .replace(/^./, (match) => match.toUpperCase())
  .trim();

const promptDownload = (dataURL, name) => {
  var link = document.createElement('a');
  link.href = dataURL;
  link.download = name;
  link.click();
}

const downloadJSON = (jsonString, name) => {
  var data = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
  promptDownload(data, name);
}

export { camelToTitle, promptDownload, downloadJSON };