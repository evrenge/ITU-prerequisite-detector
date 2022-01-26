from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium import webdriver


def create_driver():
    s = Service(ChromeDriverManager().install())

    chrome_options = Options()

    chrome_options.add_argument("--disable-extensions")
    # chrome_options.add_argument("--disable-gpu")
    # chrome_options.add_argument("--no-sandbox") # linux only
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("log-level=2")
    chrome_options.add_argument("--no-proxy-server")

    driver = webdriver.Chrome(
        service=s, options=chrome_options, service_log_path='/dev/null')
    return driver
