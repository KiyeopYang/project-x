import React, { Component } from 'react';
import pdfjsLib from 'pdfjs-dist';
import update from 'react-addons-update';

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
      scale: 1.5,
      serverUrl: '',
      fetchUrl: '',
      uploadEndpoint: '',
      getEndpoint: '',
      getResult: [],
      fileDataForUpload: null,
      
      inputs: [],
      circleNum: 1,
    };
    this.editCanvas = React.createRef();
    this.canvas = React.createRef();
    this.fileSelection = React.createRef();
    this.uploadFileSelection = React.createRef();
  }
  componentDidUpdate() {
    this.renderEditCanvas();
  }
  componentDidMount() {
    this.editCanvas.current.onclick = this.handleClickEditCanvas;
    this.fileSelection.current.onchange = this.onSelectFile;
    this.uploadFileSelection.current.onchange = e => this.setState({ fileDataForUpload: e.target.files[0] });
    this.renderPdf({ url: 'ICE3037_2018Fall_Lecture_Note01.pdf' });

    //canvas hover event
    this.editCanvas.current.onmousemove = (e) => {
      const rect = this.editCanvas.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const r = 20;
      let i = 0;

      const newArr = this.state.inputs.map((input) => {
        const { x, y } = input.arc;
        const isHover = r ** 2 > (mouseX - x) ** 2 + (mouseY - y) ** 2;
        let style = "#000000";
        if (isHover) {
          style = "#FF0000";
        }
        return {
          ...input,
          style,
        }
      });
      this.setState({ inputs: newArr });
      
    };
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

      //
      this.editCanvas.current.height = viewport.height;
      this.editCanvas.current.width = viewport.width;
      this.setState({ circleNum: 1, inputs: [] });
      //
  
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
  fetchPdf = (url) => {
    fetch(url)
      .then(res => res.arrayBuffer())
      .then((data) => {
        console.log(data);
        this.renderPdf({ data });
      });
  }
  upload = (url) => {
    fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/pdf"
      },
      body: this.state.fileDataForUpload,
    }).then(
      response => response.json()
    ).then(
      success => console.log(success)
    ).catch(
      error => console.log(error)
    );
  }
  get = (url) => {
    fetch(url, )
      .then(res => res.json())
      .then((data) => {
        console.log(data);
        this.setState({
          getResult: data,
        });
      });
  }
  handleClickEditCanvas = e => {
    const canvas = this.editCanvas.current;
    const rect = canvas.getBoundingClientRect();
    this.setState({ inputs: this.state.inputs.concat({
      arc: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      text: { x: e.clientX - rect.left, y: e.clientY - rect.top + 4, value: this.state.inputs.length + 1, label: '' },
      style: "#FF0000",
    })});
  }
  renderEditCanvas = () => {
    const canvas = this.editCanvas.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { inputs } = this.state;
    inputs.forEach((item) => {
      ctx.beginPath();
      ctx.strokeStyle=item.style;
      ctx.arc(item.arc.x, item.arc.y,20,0,2*Math.PI);
      ctx.textAlign="center"; 
      ctx.strokeText(item.text.label !== '' ? `${item.text.value}-${item.text.label}` : item.text.value, item.text.x, item.text.y);
      ctx.stroke();
    })
  }
  render() {
    return (
      <div>
        <header>
          <h2>Project X</h2>
        </header>
        <div>
          <p>
            1. PDF 작동 확인 (파일을 이용한 PDF)
            <br />
            2. 원격 서버 돌리고 pdf 파일 접근 가능하게 만든다음 테스트 (URL을 통한 PDF)
            <br />
            3. 원격 서버에 파일 업로드 테스트 (원격 서버 파일 업로드)
            <br />
            4. 업로드된 파일 리스트 테스트 (업로드 된 파일 요청)
            <br />
            5. 각 업로드된 파일 리스트 URL 이용하여 URL을 통한 PDF 호출
          </p>
        </div>
        <div>
          <h4>원격 서버 URL (*원격 서버에서 cors 허용 필요)</h4>
          <input type="text" value={this.state.serverUrl} onChange={e => this.setState({ serverUrl: e.target.value })}/>
        </div>
        <div>
          <h4>원격 서버 파일 업로드</h4>
          <p>{this.state.serverUrl}{this.state.uploadEndpoint}</p>
          <input type="text" placeholder="업로드 endpoint" value={this.state.uploadEndpoint} onChange={e => this.setState({ uploadEndpoint: e.target.value })}/>
          <br />
          <input type="file" ref={this.uploadFileSelection} />
          <button onClick={() => this.upload(`${this.state.serverUrl}${this.state.uploadEndpoint}`)}>업로드</button>
        </div>
        <div>
          <h4>업로드 된 파일 요청</h4>
          <p>{this.state.serverUrl}{this.state.getEndpoint}</p>
          <input type="text" placeholder="파일 요청 endpoint" value={this.state.getEndpoint} onChange={e => this.setState({ getEndpoint: e.target.value })}/>
          <button onClick={() => this.get(`${this.state.serverUrl}${this.state.getEndpoint}`)}>요청</button>
          <br />
          <ul>
            <li>요청이 정상적으로 되면 아래에 리스트로 표시. 응답 데이터 형식: [{ `{ url }` }] </li>
            {
              this.state.getResult.map((result) => {
                <li key={result.url}>{result.url}</li>
              })
            }
          </ul>
        </div>
        <hr />
        <div>
          <h4>URL을 통한 PDF</h4>
          <p>{this.state.serverUrl}{this.state.fetchUrl}</p>
          <input type="text" placeholder="pdf 파일 경로" value={this.state.fetchUrl} onChange={e => this.setState({ fetchUrl: e.target.value })}/>
          <button onClick={() => this.fetchPdf(`${this.state.serverUrl}${this.state.fetchUrl}`)}>Fetch</button>
        </div>
        <div>
          <h4>파일을 이용한 PDF (서버 통신 x)</h4>
          <input type="file" ref={this.fileSelection} />
        </div>
        <div>
          <h4>페이지 이동</h4>
          <button onClick={this.onPrevPage}>{`<`}</button>
          <button onClick={this.onNextPage}>{`>`}</button>
          <p>{`Page: ${this.state.pageNum}`}</p>
        </div>
        <h5>PDF (클릭 이벤트 적용)</h5>
        <canvas style={{ position: 'absolute' }} ref={this.editCanvas} id="editCanvas" />
        <canvas ref={this.canvas} id="canvas" />
        <div>
          <h4>폼</h4>
          {
            this.state.inputs.map((input, i) => (
              <div key={i}>
                <p>{i + 1}</p>
                <input
                  type="text"
                  value={input.text.label}
                  onChange={e => {
                    this.setState({
                      inputs: update(this.state.inputs, { [i]: { text: { label: { $set: e.target.value } } } }),
                    })
                  }}
                />
              </div>
            ))
          }
        </div>
      </div>
    );
  }
}

export default App;
