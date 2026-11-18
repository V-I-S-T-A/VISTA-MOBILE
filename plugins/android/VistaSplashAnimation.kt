package expo.modules.splashscreen

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.animation.LinearInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.splashscreen.SplashScreenViewProvider

// Decorate Android's existing splash view during its exit. No new Activity,
// window, React screen, or second splash is created. Missing app resources leave
// Expo's normal removal behavior intact (for example in a generic Expo client).
internal fun animateVistaSplash(provider: SplashScreenViewProvider, onComplete: () -> Unit): Boolean {
  val root = provider.view as? ViewGroup ?: return false
  val context = root.context
  val resources = context.resources
  val mark = resources.getIdentifier("splash_mark", "drawable", context.packageName)
  val credit = resources.getIdentifier("splash_branding", "drawable", context.packageName)
  if (mark == 0 || credit == 0) return false
  val animationsEnabled = if (Build.VERSION.SDK_INT >= 26) ValueAnimator.areAnimatorsEnabled()
    else Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) != 0f
  if (!animationsEnabled) return false
  val density = resources.displayMetrics.density
  fun dp(value: Int) = (value * density + 0.5f).toInt()
  // The compatibility splash view can exclude the navigation bar while the OS
  // launch drawable covers the whole window. Anchor to that same window rather
  // than recentering/upshifting when the exit callback begins.
  val windowManager = context.getSystemService(android.content.Context.WINDOW_SERVICE) as WindowManager
  val windowBounds = if (Build.VERSION.SDK_INT >= 30) windowManager.currentWindowMetrics.bounds else {
    val metrics = DisplayMetrics()
    windowManager.defaultDisplay.getRealMetrics(metrics)
    Rect(0, 0, metrics.widthPixels, metrics.heightPixels)
  }
  val location = IntArray(2)
  root.getLocationOnScreen(location)
  val centerOffset = windowBounds.exactCenterY() - location[1] - root.height / 2f
  val bottomOffset = windowBounds.bottom - location[1] - root.height
  val panel = FrameLayout(context).apply {
    setBackgroundColor(Color.WHITE)
    importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
    isClickable = true
  }
  root.addView(panel, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
  val halo = View(context).apply {
    background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.rgb(26, 89, 165)) }
    alpha = 0f
  }
  val ring = View(context).apply {
    background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.TRANSPARENT); setStroke(dp(1), Color.rgb(26, 89, 165)) }
    alpha = 0f
  }
  val logo = ImageView(context).apply { setImageResource(mark); scaleType = ImageView.ScaleType.FIT_CENTER }
  panel.addView(halo, FrameLayout.LayoutParams(dp(164), dp(164), Gravity.CENTER))
  panel.addView(ring, FrameLayout.LayoutParams(dp(188), dp(188), Gravity.CENTER))
  panel.addView(logo, FrameLayout.LayoutParams(dp(120), dp(120), Gravity.CENTER))
  for (view in arrayOf(halo, ring, logo)) view.translationY = centerOffset
  val creator = ImageView(context).apply { setImageResource(credit); scaleType = ImageView.ScaleType.FIT_CENTER }
  panel.addView(creator, FrameLayout.LayoutParams(dp(200), dp(80), Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
    // Match the launch drawable exactly; transient Android navigation bars must
    // not move the creator credit between the static and animated frames.
    bottomMargin = dp(24) - bottomOffset
  })
  val times = floatArrayOf(0f, .13f, .24f, .37f, .52f, 1f)
  fun keyframe(value: Float, values: FloatArray): Float {
    for (i in 0 until times.lastIndex) if (value <= times[i + 1]) {
      val fraction = (value - times[i]) / (times[i + 1] - times[i])
      return values[i] + fraction * (values[i + 1] - values[i])
    }
    return values.last()
  }
  val logoScale = floatArrayOf(1f, 1.065f, 1f, 1.04f, 1f, 1f)
  val haloScale = floatArrayOf(.75f, 1f, .9f, 1.18f, 1.28f, 1.28f)
  val alpha = floatArrayOf(0f, .13f, .05f, .1f, 0f, 0f)
  val animation = ValueAnimator.ofFloat(0f, 1f).apply { duration = 1100L; interpolator = LinearInterpolator() }
  animation.addUpdateListener {
    val value = it.animatedValue as Float
    val scale = keyframe(value, logoScale)
    logo.scaleX = scale; logo.scaleY = scale
    val spread = keyframe(value, haloScale)
    val opacity = keyframe(value, alpha)
    for (view in arrayOf(halo, ring)) { view.scaleX = spread; view.scaleY = spread; view.alpha = opacity }
  }
  val attachListener = object : View.OnAttachStateChangeListener {
    override fun onViewAttachedToWindow(view: View) = Unit
    override fun onViewDetachedFromWindow(view: View) { animation.cancel() }
  }
  root.addOnAttachStateChangeListener(attachListener)
  animation.addListener(object : AnimatorListenerAdapter() {
    override fun onAnimationEnd(animator: Animator) {
      root.removeOnAttachStateChangeListener(attachListener)
      onComplete()
    }
  })
  animation.start()
  return true
}
