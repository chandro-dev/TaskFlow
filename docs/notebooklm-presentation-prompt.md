# Prompt Para NotebookLM

Usa este prompt en NotebookLM tomando como base estos documentos del proyecto:

- `docs/design-patterns-guide.md`
- `docs/pattern-traceability.md`
- `docs/notebooklm-pattern-slides.md`
- `docs/taskflow-class-diagram.puml`

## Prompt Principal

```md
Actua como un arquitecto de software senior, experto en patrones de diseno, Clean Architecture, aplicaciones empresariales con Next.js, TypeScript y Supabase, y tambien como un asesor academico que ayuda a construir presentaciones tecnicas de alto impacto.

Tu tarea es generar una presentacion avanzada, clara y visualmente potente sobre la aplicacion Taskflow, basada exclusivamente en la documentacion cargada en este NotebookLM.

Quiero que construyas una narrativa completa y profesional para una exposicion tecnica, no un simple resumen. La salida debe estar pensada para convertirse en diapositivas, con lenguaje academico pero comprensible, y debe ayudarme a defender decisiones tecnicas frente a un jurado, profesor o equipo de evaluacion.

Debes cubrir obligatoriamente estos ejes:

1. Contexto general de la aplicacion.
Explica que problema resuelve Taskflow, por que una plataforma de gestion de tareas con proyectos, tableros Kanban, tareas, subtareas, invitaciones, notificaciones y configuracion requiere una arquitectura bien pensada.

2. Arquitectura del sistema.
Explica la arquitectura por capas usada en la aplicacion:
- capa app
- capa application
- capa domain
- capa infrastructure
- componentes reutilizables

Describe como se relacionan entre si y por que esta separacion mejora mantenimiento, escalabilidad, pruebas, legibilidad y responsabilidad unica.

3. Patrones de diseno implementados.
Quiero una seccion fuerte y profunda donde expliques, uno por uno:
- Abstract Factory
- Singleton
- Builder
- Factory Method
- Prototype
- Observer

Para cada patron debes explicar:
- el problema que resuelve
- por que fue elegido en esta aplicacion
- donde aparece conceptualmente
- que clases, interfaces o archivos lo implementan
- cual es el flujo real de uso dentro de la app
- ventajas concretas que aporta
- riesgos o desventajas de usarlo mal

4. Problemas reales de implementar patrones en una app Next.js.
Quiero una seccion critica y madura, no complaciente.
Explica las dificultades de usar patrones de diseno clasicos dentro de una app moderna basada en Next.js App Router, Server Components, Route Handlers y cliente/servidor mixto.

Debes abordar problemas como:
- mezcla entre logica de UI y logica de negocio si no se separa bien
- riesgo de crear sobreingenieria al usar demasiados patrones
- dificultad de mantener trazabilidad de patrones en proyectos grandes
- friccion entre patrones orientados a objetos y ecosistema React/Next mas funcional
- complejidad de sincronizar estado entre cliente, servidor y Supabase
- impacto de RLS, sesiones, RPC y permisos en el diseno real
- como un patron bien usado ayuda, pero uno mal usado complica mas el sistema

5. Problematica tecnica del desarrollo.
Analiza la complejidad real del proyecto:
- autenticacion
- roles y permisos
- RLS en Supabase
- membresias por proyecto
- invitaciones internas
- notificaciones
- drag and drop en Kanban
- clonacion de tareas y subtareas
- gestion de tema global
- persistencia con Supabase y fallback mock

Explica por que este tipo de aplicacion no es trivial y que errores arquitectonicos podrian volverla inmantenible.

6. Analisis critico de ventajas y desventajas.
Genera una comparacion seria entre:
- usar patrones correctamente
- no usar patrones
- usar patrones en exceso

Quiero que expliques tradeoffs reales, no definiciones genericas.

7. Conclusion de alto impacto.
La conclusion debe sonar convincente y profesional.
Debe dejar claro que la aplicacion no solo funciona, sino que fue pensada con criterios de ingenieria de software, escalabilidad, mantenibilidad y trazabilidad tecnica.

8. Estructura para diapositivas.
Quiero que organices la respuesta en formato util para presentacion:
- titulo sugerido de cada diapositiva
- objetivo de la diapositiva
- ideas clave
- mensaje oral sugerido para explicar
- transicion recomendada a la siguiente diapositiva

9. Elementos visuales sugeridos.
Para cada bloque importante, sugiere que tipo de apoyo visual conviene:
- diagrama de capas
- tabla comparativa
- mapa de clases
- secuencia de flujo
- lista de problemas y soluciones
- grafico de decisiones arquitectonicas

10. Plantilla final editable.
Al final de la respuesta quiero una plantilla separada, reutilizable y editable, con espacios o marcadores para que yo pueda completar:
- nombre del expositor
- objetivo del proyecto
- decision arquitectonica principal
- patron mas importante
- problema tecnico mas dificil
- solucion aplicada
- conclusion personal
- mejoras futuras

La salida debe verse como material de presentacion premium:
- bien estructurada
- profunda
- critica
- orientada a sustentacion
- enfocada en justificar decisiones tecnicas

No hagas una respuesta superficial. Prioriza profundidad, razonamiento, trazabilidad y valor academico.
```

## Prompt Breve

```md
Genera una presentacion tecnica de alto nivel sobre Taskflow basada en la documentacion cargada. Explica arquitectura, patrones de diseno, trazabilidad de clases e interfaces, ventajas, desventajas, dificultades reales de implementar estos patrones en Next.js + Supabase, complejidad de permisos y RLS, y conclusiones para sustentacion. Organiza la respuesta como diapositivas con mensaje oral sugerido y agrega al final una plantilla editable para personalizar la exposicion.
```

## Plantilla Editable

Usa esta plantilla al final de la respuesta o como diapositiva final:

```md
# Plantilla Final De Sustentacion

## Datos base
- Expositor:
- Curso / materia:
- Fecha:
- Nombre del proyecto:

## Problema que resuelve la aplicacion
- 

## Objetivo principal del sistema
- 

## Arquitectura elegida
- 

## Patron de diseno mas importante
- Patron:
- Motivo:
- Beneficio tecnico:

## Patron mas dificil de implementar
- Patron:
- Dificultad:
- Solucion aplicada:

## Problema tecnico mas complejo del proyecto
- Problema:
- Impacto:
- Solucion:

## Por que Next.js hizo mas complejo el desarrollo
- 

## Por que Supabase y RLS aumentaron la exigencia tecnica
- 

## Leccion de ingenieria aprendida
- 

## Mejora futura mas importante
- 

## Cierre final
- 
```

## Recomendacion De Uso

Si quieres una salida todavia mejor dentro de NotebookLM:

1. Carga primero los `.md` y el `.puml`.
2. Pega el `Prompt Principal`.
3. Luego pide una segunda iteracion con algo como:

```md
Ahora convierte esta respuesta en una version mas ejecutiva, con 12 a 15 diapositivas maximo, manteniendo profundidad tecnica y agregando una comparacion entre beneficios y riesgos de usar patrones en exceso.
```

4. Finalmente pide:

```md
Ahora genera una version oral, como si yo fuera a exponer cada diapositiva frente a un jurado tecnico.
```
