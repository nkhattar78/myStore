const Spinner = ()=>{
    return(
        <div className="preloader-wrapper active">
        <div className="spinner-layer spinner-blue-only">
          <div className="circle-clipper left">
            <div className="circle"></div>
          </div><div className="gap-patch">
            <div className="circle"></div>
          </div><div className="circle-clipper center">
            <div className="circle"></div>
          </div>
        </div>
      </div>
    )
}

export default Spinner;
