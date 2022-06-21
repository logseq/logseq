const imageS1: any = new URL('./assets/tutorials-1.png', import.meta.url)

export function TutorialFeaturesSlide () {
  return (
    <div className="app-tutorial-features-slide">
      <div className="inner px-14">
        {/*  Tabs */}
        <ul className="tabs flex flex space-x-8 justify-around">
          <li className="active"><span>🧑‍🎓</span><strong>Students</strong></li>
          <li><span>🖋</span><strong>Writers</strong></li>
          <li><span>🎓</span><strong>Academics</strong></li>
          <li><span>📆</span><strong>Project Managers</strong></li>
          <li><span>💻</span><strong>Developers</strong></li>
        </ul>

        {/* Panel */}
        <article className="panels">
          <div className="hd">
            <strong>
              <i>1</i>
              <i>2</i>
            </strong>

            <h1 className='flex text-3xl justify-center'>
              Capturing and structuring class notes
            </h1>
          </div>
          <div className="bd">
            <div className="wrap flex">
              <img src={imageS1} alt="images"/>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

export function TutorialShowcase (
  props: {},
) {

  return (
    <div className="app-tutorial-showcase">
      {/* Head Slogan */}
      <div className="flex flex-col justify-center items-center py-20 hd">
        <h1 className="text-6xl opacity-70">Today, everyone is a</h1>
        <h2 className="text-6xl font-semibold pt-1 opacity-94">knowledge
          worker.</h2>

        <h3 className="text-4xl font-normal pt-8 opacity-60">Logseq is the
          all-in-one tool
          for </h3>
        <h4 className="text-4xl pt-2 opacity-94">
          workflows that deal with lots of information:
        </h4>
      </div>

      {/* Head icons */}
      <ul className="sub-hd flex justify-center space-x-10">
        <li>Task Management</li>
        <li>PDF Annotations</li>
        <li>Flashcards</li>
      </ul>

      {/* Tutorial Features Slide */}
      <TutorialFeaturesSlide/>
    </div>
  )
}
