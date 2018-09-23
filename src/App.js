import React, { Component } from 'react';
import pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  '../../build/webpack/pdf.worker.bundle.js';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pageNum : 1,
      pdfDoc: null,
      pageRendering: false,
      pageNumPending: null,
      scale: 1,
      fetchUrl: '',
    };
    this.canvas = React.createRef();
    this.fileSelection = React.createRef();
  }
  componentDidMount() {
    this.fileSelection.current.onchange = this.onSelectFile;
    this.renderPdf({ url: 'a.pdf' });
  }
  onSelectFile = e => {
    const fileReader = new FileReader();
    fileReader.onloadend = e => {
      this.renderPdf({ data: e.target.result });
    }
    const file = e.target.files[0];
    fileReader.readAsArrayBuffer(file);
  }
  renderPdf = ({ url, data }) => {
    pdfjsLib.getDocument(url ? url : { data }).then((pdfDocument) => {
      this.setState({ pdfDoc: pdfDocument });
      this.renderPage(1);
    }).catch(function (reason) {
      console.error('Error: ' + reason);
    });
  }
  renderPage(num) {
    this.setState({ pageRendering: true });
    this.state.pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport(this.state.scale);
      this.canvas.current.height = viewport.height;
      this.canvas.current.width = viewport.width;
  
      const renderContext = {
        canvasContext: this.canvas.current.getContext('2d'),
        viewport: viewport
      };
      const renderTask = page.render(renderContext);
  
      renderTask.promise.then(() => {
        this.setState({ pageRendering: false });
        if (this.state.pageNumPending !== null) {
          this.renderPage(this.state.pageNumPending);
          this.setState({ pageNumPending: null });
        }
      });
    });
    this.setState({ pageNum: num });
  }
  queueRenderPage = (num) => {
    if (this.state.pageRendering) {
      this.setState({ pageNumPending: num });
    } else {
      this.renderPage(num);
    }
  }
  onPrevPage = () => {
    if (this.state.pageNum <= 1) {
      return;
    }
    const pageNum = this.state.pageNum - 1;
    this.setState({ pageNum });
    this.queueRenderPage(pageNum);
  }
  onNextPage = () => {
    if (this.state.pageNum >= this.state.pdfDoc.numPages) {
      return;
    }
    const pageNum = this.state.pageNum + 1;
    this.setState({ pageNum });
    this.queueRenderPage(pageNum);
  }
  render() {
    return (
      <div>
        <header>
          <h2>Project X</h2>
        </header>
        <div>
          <h4>파일을 이용한 PDF (서버 통신 x)</h4>
          <input type="file" ref={this.fileSelection} />
        </div>
        <div>
          <h4>URL을 통한 PDF</h4>
          <input type="text" value={this.state.fetchUrl} onChange={e => this.setState({ fetchUrl: e.target.value })}/>
          <button onClick={() => this.renderPdf({ url: this.state.fetchUrl })}>Fetch</button>
        </div>
        <div>
          <button onClick={this.onPrevPage}>{`<`}</button>
          <button onClick={this.onNextPage}>{`>`}</button>
          <p>{`Page: ${this.state.pageNum}`}</p>
        </div>
        <canvas ref={this.canvas} id="canvas" />
      </div>
    );
  }
}

export default App;
