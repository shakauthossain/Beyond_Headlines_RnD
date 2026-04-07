interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, any>;
  marks?: { type: string; attrs?: Record<string, any> }[];
}

export function renderTiptapJson(json: any): string {
  if (!json || !json.content) return '';

  const renderNode = (node: TiptapNode): string => {
    let html = '';
    
    const content = node.content ? node.content.map(renderNode).join('') : '';

    switch (node.type) {
      case 'doc':
        return content;
      case 'paragraph':
        return `<p>${content}</p>`;
      case 'text':
        let text = node.text || '';
        if (node.marks) {
          node.marks.forEach(mark => {
            if (mark.type === 'bold') text = `<strong>${text}</strong>`;
            if (mark.type === 'italic') text = `<em>${text}</em>`;
            if (mark.type === 'underline') text = `<u>${text}</u>`;
            if (mark.type === 'link') text = `<a href="${mark.attrs?.href}" class="text-red-600 hover:underline">${text}</a>`;
          });
        }
        return text;
      case 'heading':
        const level = node.attrs?.level || 1;
        return `<h${level}>${content}</h${level}>`;
      case 'bulletList':
        return `<ul>${content}</ul>`;
      case 'orderedList':
        return `<ol>${content}</ol>`;
      case 'listItem':
        return `<li>${content}</li>`;
      case 'blockquote':
        return `<blockquote>${content}</blockquote>`;
      case 'horizontalRule':
        return `<hr />`;
      case 'hardBreak':
        return `<br />`;
      default:
        return content;
    }
  };

  return renderNode(json);
}
