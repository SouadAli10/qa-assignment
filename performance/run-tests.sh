#!/bin/bash

# Performance Testing Script for Todo APIs
# This script runs K6 performance tests against both Node.js and Go APIs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s -f "$url/health" > /dev/null 2>&1; then
        print_success "$name is running"
        return 0
    else
        print_error "$name is not running at $url"
        return 1
    fi
}

# Function to run K6 test
run_k6_test() {
    local test_file=$1
    local api_type=$2
    local test_name=$3
    local output_dir="results"
    
    print_status "Running $test_name for $api_type API..."
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Generate timestamp for unique filenames
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local output_file="$output_dir/${api_type}_${test_name}_${timestamp}"
    
    # Run K6 test with JSON output
    if API_TYPE="$api_type" k6 run --out json="$output_file.json" "$test_file"; then
        print_success "$test_name completed for $api_type API"
        
        # Generate HTML report (if available)
        if command -v k6-html-reporter &> /dev/null; then
            k6-html-reporter --json-file "$output_file.json" --output "$output_file.html"
            print_success "HTML report generated: $output_file.html"
        fi
        
        return 0
    else
        print_error "$test_name failed for $api_type API"
        return 1
    fi
}

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --test TYPE      Test type: load, stress, spike, or all (default: all)"
    echo "  -a, --api API        API type: nodejs, golang, or both (default: both)"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Run all tests on both APIs"
    echo "  $0 -t load                  # Run only load tests on both APIs"
    echo "  $0 -a nodejs               # Run all tests on Node.js API only"
    echo "  $0 -t stress -a golang     # Run stress test on Go API only"
}

# Default values
TEST_TYPE="all"
API_TYPE="both"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--test)
            TEST_TYPE="$2"
            shift 2
            ;;
        -a|--api)
            API_TYPE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate arguments
if [[ ! "$TEST_TYPE" =~ ^(load|stress|spike|all)$ ]]; then
    print_error "Invalid test type: $TEST_TYPE"
    usage
    exit 1
fi

if [[ ! "$API_TYPE" =~ ^(nodejs|golang|both)$ ]]; then
    print_error "Invalid API type: $API_TYPE"
    usage
    exit 1
fi

# Check if K6 is installed
if ! command -v k6 &> /dev/null; then
    print_error "K6 is not installed. Please install K6 first."
    print_status "Visit: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

print_status "Starting performance tests..."
print_status "Test type: $TEST_TYPE"
print_status "API type: $API_TYPE"

# Check if APIs are running
apis_to_test=()

if [[ "$API_TYPE" == "both" || "$API_TYPE" == "nodejs" ]]; then
    if check_service "http://localhost:3000" "Node.js API"; then
        apis_to_test+=("nodejs")
    else
        print_warning "Skipping Node.js API tests - service not available"
    fi
fi

if [[ "$API_TYPE" == "both" || "$API_TYPE" == "golang" ]]; then
    if check_service "http://localhost:3001" "Go API"; then
        apis_to_test+=("golang")
    else
        print_warning "Skipping Go API tests - service not available"
    fi
fi

if [[ ${#apis_to_test[@]} -eq 0 ]]; then
    print_error "No APIs are running. Please start the APIs first."
    exit 1
fi

# Determine which tests to run
tests_to_run=()

case $TEST_TYPE in
    "load")
        tests_to_run+=("load")
        ;;
    "stress")
        tests_to_run+=("stress")
        ;;
    "spike")
        tests_to_run+=("spike")
        ;;
    "all")
        tests_to_run+=("load" "stress" "spike")
        ;;
esac

# Run the tests
total_tests=$((${#apis_to_test[@]} * ${#tests_to_run[@]}))
current_test=0
failed_tests=0

for api in "${apis_to_test[@]}"; do
    for test in "${tests_to_run[@]}"; do
        current_test=$((current_test + 1))
        print_status "Progress: $current_test/$total_tests"
        
        case $test in
            "load")
                test_file="k6/load-test-${api}.js"
                ;;
            "stress")
                test_file="k6/stress-test.js"
                ;;
            "spike")
                test_file="k6/spike-test.js"
                ;;
        esac
        
        if ! run_k6_test "$test_file" "$api" "$test"; then
            failed_tests=$((failed_tests + 1))
        fi
        
        # Add a small delay between tests
        if [[ $current_test -lt $total_tests ]]; then
            print_status "Waiting 30 seconds before next test..."
            sleep 30
        fi
    done
done

# Summary
echo ""
print_status "Performance testing completed!"
print_status "Total tests: $total_tests"
print_success "Successful tests: $((total_tests - failed_tests))"

if [[ $failed_tests -gt 0 ]]; then
    print_error "Failed tests: $failed_tests"
    exit 1
else
    print_success "All tests completed successfully!"
fi

print_status "Results saved in the 'results' directory"