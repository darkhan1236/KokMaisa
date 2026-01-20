// src/app/components/About.jsx

function About() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900 font-bold">
            Что такое KokMaisa?
          </h2>
          <div className="w-16 h-1 bg-green-500 mx-auto rounded-full mb-8"></div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-amber-50 rounded-3xl p-10 md:p-14 shadow-xl">
          <p className="text-xl md:text-2xl text-gray-800 leading-relaxed mb-6">
            KokMaisa — это продвинутая AI-платформа, которая предсказывает биомассу пастбищ (кг/га) с использованием самых современных моделей глубокого обучения, обученных на тысячах реальных полевых измерений.
          </p>

          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            Наши модели используют{' '}
            <span className="text-green-700 font-medium">свёрточные нейронные сети (CNN)</span> и{' '}
            <span className="text-green-700 font-medium">Vision Transformers</span>, в сочетании с данными NDVI со спутников и{' '}
            <span className="text-green-700 font-medium">экологическими параметрами</span>, чтобы обеспечивать точные оценки биомассы в реальном времени для устойчивого управления пастбищами.
          </p>
        </div>
      </div>
    </section>
  );
}

export default About;