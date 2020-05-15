const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.02
const strokeFactor : number = 90
const sizeFactor : number = 2.9
const foreColor : string = "#3F51B5"
const backColor : string = "#BDBDBD"
const delay : number = 20
const nodes : number = 5
const parts : number = 2
const rFactor : number = 3.3

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
    }

    static sinify(scale : number) : number {
        return Math.sin(scale * Math.PI)
    }
}

class DrawingUtil {

    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawCircle(context : CanvasRenderingContext2D, x : number, y : number, r : number) {
        context.beginPath()
        context.arc(x, y, r, 0, 2 * Math.PI)
        context.fill()
    }

    static drawRotateLineJumpingCircle(context : CanvasRenderingContext2D, h : number, scale : number, size : number) {
        const sf : number = ScaleUtil.sinify(scale)
        const sf1 : number = ScaleUtil.divideScale(sf, 0, 2)
        const sf2 : number = ScaleUtil.divideScale(sf, 1, 2)
        context.save()
        context.translate(0, h / 2)
        context.rotate(sf1 * Math.PI / 2)
        DrawingUtil.drawLine(context, 0, 0, 0, -size)
        context.restore()
        const r : number = size / rFactor
        DrawingUtil.drawCircle(context, size / 2, r + (h / 2 - 2 * r) * sf2, r)
        console.log(scale, r, h, size)
    }

    static drawJLBNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        const gap : number = w / (nodes)
        const size : number = gap / sizeFactor
        context.strokeStyle = foreColor
        context.fillStyle = foreColor
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.save()
        context.translate(gap * i, 0)
        DrawingUtil.drawRotateLineJumpingCircle(context, h, scale, size)
        context.restore()
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
      this.scale += scGap * this.dir
      if (Math.abs(this.scale - this.prevScale) > 1) {
          this.scale = this.prevScale + this.dir
          this.dir = 0
          this.prevScale = this.scale
          cb()
      }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    interval : number
    animated : boolean = false

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class JLBNode {

    next : JLBNode
    prev : JLBNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new JLBNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawJLBNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : JLBNode {
        var curr : JLBNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class JumpingBallLineHolder {

    root : JLBNode = new JLBNode(0)
    curr : JLBNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, ()=> {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    jblh : JumpingBallLineHolder = new JumpingBallLineHolder()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.jblh.draw(context)
    }

    handleTap(cb : Function) {
        this.jblh.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.jblh.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
