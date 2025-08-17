import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, err:null }; }
  static getDerivedStateFromError(err){ return { hasError:true, err }; }
  componentDidCatch(err, info){ console.error("Comments crashed:", err, info); }
  render(){
    if (this.state.hasError) {
      return (
        <div style={{padding:"16px", borderRadius:12, border:"1px solid #e2e8f0"}}>
          <div style={{fontWeight:600, marginBottom:8}}>Не удалось показать комментарии</div>
          <div style={{opacity:.7, fontSize:14}}>
            {String(this.state.err?.message || "Неизвестная ошибка")}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
