const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));

if (!fs.existsSync('api-reference')) {
    fs.mkdirSync('api-reference');
}

const tags = {};

Object.entries(swagger.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, endpoint]) => {
        const tag = endpoint.tags?.[0] || 'Default';
        if (!tags[tag]) tags[tag] = [];
        tags[tag].push({ path, method, ...endpoint });
    });
});

let navPages = [];

Object.entries(tags).forEach(([tag, endpoints]) => {
    const folderName = tag.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const folderPath = `api-reference/${folderName}`;
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

    endpoints.forEach(endpoint => {
        let summaryId = endpoint.summary ? endpoint.summary.toLowerCase().replace(/[^a-z0-9]/g, '-') : endpoint.operationId.toLowerCase();
        if (!summaryId) { summaryId = endpoint.method; }
        const filename = `${summaryId}.mdx`;
        const filepath = `${folderPath}/${filename}`;
        
        let mdx = `---
title: "${endpoint.summary || endpoint.operationId || 'Endpoint'}"
api: "${endpoint.method.toUpperCase()} ${pathFormatter(endpoint.path)}"
description: "${(endpoint.description || '').replace(/"/g, '\\"')}"
---

`;

        mdx += `### Request\n\n`;

        if (endpoint.parameters && endpoint.parameters.length > 0) {
            endpoint.parameters.forEach(param => {
                mdx += `<ParamField ${param.in}="${param.name}" type="${param.schema?.type || 'string'}" ${param.required ? 'required' : ''}>
  ${param.description || 'The ' + param.name}
</ParamField>\n\n`;
            });
        }
        
        if (endpoint.requestBody) {
             mdx += `\n**Request Body**\n\n`;
             mdx += `See OpenAPI schema.\n`;
        }
        
        mdx += `### Response\n\n`;
        
        Object.entries(endpoint.responses).forEach(([code, resp]) => {
            mdx += `<ResponseField name="${code}" type="object">
  ${resp.description || ''}
</ResponseField>\n\n`;
        });

        fs.writeFileSync(filepath, mdx);
        navPages.push(`${folderPath}/${summaryId}`);
    });
});

function pathFormatter(path) {
    return path.replace(/\{([^}]+)\}/g, '{$1}');
}

console.log("Pages generated:", navPages);
