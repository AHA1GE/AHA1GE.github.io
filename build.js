/**
 * @fileOverview build.js
 * 1. cpoies the static files in src/static to public
 * 2. translate the markdown in src/pages,use template to warp the html, save to html in public.
 * 3. convert every html file to pdf for download
 */

const fs = require("fs");
const path = require("path");
const marked = require("marked");
const rimraf = require("rimraf");
const puppeteer = require("puppeteer");

const srcDir = path.join(__dirname, "src");
const publicDir = path.join(__dirname, "public");
const pagesDir = path.join(srcDir, "pages");
const pagesTemplateDir = path.join(srcDir, "template");

// all markdown2html shared css
const mdCss = fs.readFileSync(
  path.join(pagesTemplateDir, "markdown.css"),
  "utf8"
);

// all markdown2html shared html base
const mdHtml = fs.readFileSync(
  path.join(pagesTemplateDir, "markdown.html"),
  "utf8"
);

async function prepareDir() {
  // create public directory if not exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  } else {
    // clear public directory
    rimraf.sync(publicDir);
    fs.mkdirSync(publicDir);
  }
}

async function copyStaticFiles() {
  const copyRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);

    items.forEach((item) => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);

      if (fs.lstatSync(srcPath).isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  };

  const srcStaticDir = path.join(srcDir, "static");
  const destStaticDir = path.join(publicDir);

  copyRecursive(srcStaticDir, destStaticDir);
  console.log("Static files copied");
}

function translateMarkdownToHtml(md, css) {
  // extract metadata from markdown, jskyll style
  const metadataText = md.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]/);

  const mdContent = metadataText ? md.replace(metadataText[0], "") : md;

  let metadata = {};
  if (metadataText) {
    md = md.replace(metadataText[0], "");
    metadataText[1].split("\n").forEach((line) => {
      const [key, value] = line.split(":");
      metadata[key.trim()] = value.trim().replace(/^"(.*)"$/, "$1");
    });
  } else {
    console.log("No metadata found, use default");
    metadata = {
      charset: "utf-8",
      title: "Untitled",
      description: "No description",
      viewport: "width=device-width, initial-scale=1",
      author: "Anonymous",
      filename: "untitled.md",
    };
  }

  // compose metaData as html meta tags
  let metaHtml = "";
  Object.entries(metadata).forEach(([key, value]) => {
    if (key === "title") {
      metaHtml += `<title>${value}</title>`;
    } else {
      metaHtml += `<meta name="${key}" content="${value}">`;
    }
  });

  // compose header
  const header = "";

  // use marked to translate markdown to html
  marked.setOptions({ headerIds: false }); // Disable automatic ID generation
  const translatedContent = marked.parse(mdContent);

  // compose footer
  const footer = "";

  // use replace() to replace the content of the markdown with the html
  return mdHtml
    .replace(`<meta id="mdMeta">`, metaHtml)
    .replace(`<style id="mdCss"></style>`, `<style>${mdCss + css}</style>`)
    .replace(
      `<header id="header"></header>`,
      `<header id="header">${header}</header>`
    )
    .replace(
      `<main id="content"></main>`,
      `<div id="content">
      ${translatedContent}</div>
      <downloadButton></downloadButton>`
    )
    .replace(
      `<footer id="footer"></footer>`,
      `<footer id="footer">${footer}</footer>`
    );
}

async function convertHtmlToPdf(htmlText, pdfFilePath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlText);
  await page.pdf({ path: pdfFilePath, format: "A4" });
  await browser.close();
}

async function build() {
  prepareDir();
  copyStaticFiles();

  // translate markdown to html and convert to pdf
  fs.readdirSync(path.join(pagesDir)).forEach(async (file) => {
    // read markdown file
    const md = fs.readFileSync(path.join(pagesDir, file), "utf8");

    // read css file (if exists)
    let css = "";
    const cssFilePath = path.join(
      srcDir,
      "pages",
      file.replace(/\.md$/, ".css")
    );
    if (fs.existsSync(cssFilePath)) {
      css = fs.readFileSync(cssFilePath, "utf8");
    }

    // compose download button html, link point to meta.filename remove .md + .pdf
    const downloadButton = `
    <div>
      <a class="button" href="${file.replace(/\.md$/, ".pdf")}">下载</a>
    </div>
    `;

    // translate markdown to html,
    const htmlText = translateMarkdownToHtml(md, css);
    // inject css and download button
    const htmlPage = htmlText.replace(
      `<downloadButton></downloadButton>`,
      downloadButton
    );

    // write html to public
    const htmlFilePath = path.join(publicDir, file.replace(/\.md$/, ".html"));
    // create html file
    fs.writeFileSync(htmlFilePath, htmlPage);
    console.log("HTML created: ", htmlFilePath);
    // convert html to pdf
    const pdfFilePath = path.join(publicDir, file.replace(/\.md$/, ".pdf"));
    const htmlTextTrimed = htmlText.replace(
      "<downloadButton></downloadButton>",
      null
    );
    convertHtmlToPdf(htmlText, pdfFilePath)
      .then(() => {
        console.log(`PDF created: ${pdfFilePath}`);
      })
      .catch((err) => {
        console.error(`Failed to create PDF: ${err}`);
      });
  });
}

build();
