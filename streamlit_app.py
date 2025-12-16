import streamlit as st
import streamlit.components.v1 as components

# Page ki settings (Wide mode taaki website puri dikhe)
st.set_page_config(page_title="Sales Forecaster", layout="wide")

# Option 1: Direct Link Button (Agar embed load na ho)
st.title("🚀 Sales Forecasting App")
st.markdown("Agar niche app load nahi ho raha, toh direct link par click karein:")
st.link_button("Open Full Website", "https://project-one-cyan-11.vercel.app/")

# Option 2: Website ko yahi embed karna (Iframe)
# Height ko adjust kar sakte ho (e.g., 800, 1000)
components.iframe("https://project-one-cyan-11.vercel.app/", height=1000, scrolling=True)