import streamlit as st
import streamlit.components.v1 as components

# 1. Page Configuration (Wide mode & Collapsed Sidebar)
st.set_page_config(
    page_title="Sales Forecaster",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 2. Custom CSS (Taaki upar ka extra space hat jaye aur full screen feel aaye)
st.markdown("""
    <style>
        /* Remove top padding and margins */
        .block-container {
            padding-top: 0rem;
            padding-bottom: 0rem;
            padding-left: 0rem;
            padding-right: 0rem;
            max-width: 100%;
        }
        /* Hide default header element if visible */
        header {visibility: hidden;}
    </style>
""", unsafe_allow_html=True)

# 3. Embed Vercel Website (Full Height)
# Height 1000px rakha hai taaki scroll kam karna pade
components.iframe("https://project-one-cyan-11.vercel.app/", height=1000, scrolling=True)